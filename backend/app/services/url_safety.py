"""SSRF-safe validation for externally-supplied URLs that our backend fetches
on a third party's behalf (e.g. TikTok's PULL_FROM_URL proxy re-serving a
store's product photo). Framework-free so it stays unit-testable in isolation.

Design: resolve-then-validate, not full IP-pinning. This closes the vast
majority of real-world SSRF payloads (internal IPs, cloud metadata, localhost,
decimal/octal/hex-obfuscated IPs, since getaddrinfo normalizes all of those
before the ipaddress check below ever runs). It leaves a narrow DNS-rebinding
TOCTOU window (attacker flips DNS between this check and the caller's actual
fetch) as an accepted residual risk: this endpoint requires a valid, revocable
ecommerce API key to reach, not a fully open public attack surface, so full
IP-pinning (which needs custom TLS/SNI handling to keep cert verification
correct) isn't worth the added complexity here.
"""
import ipaddress
import socket
from urllib.parse import urlsplit


class UnsafeUrlError(Exception):
    """Raised when a URL fails SSRF safety checks."""


def _is_unsafe_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    # Unwrap IPv4-mapped IPv6 addresses (e.g. ::ffff:169.254.169.254) before
    # checking, since is_private/is_link_local etc. don't consistently see
    # through the v6 wrapper.
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    # is_link_local covers 169.254.169.254 (the AWS/GCP/Azure cloud metadata
    # address, the single most common SSRF payload) — noted explicitly so a
    # future reader doesn't have to re-derive that it's covered.
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def resolve_and_validate(url: str) -> str:
    """Return the URL's hostname if it's safe to fetch, else raise UnsafeUrlError."""
    parts = urlsplit(url)
    if parts.scheme != "https":
        raise UnsafeUrlError("URL must use https")

    hostname = parts.hostname
    if not hostname:
        raise UnsafeUrlError("URL has no hostname")

    try:
        addrinfo = socket.getaddrinfo(hostname, 443)
    except socket.gaierror as e:
        raise UnsafeUrlError(f"Could not resolve hostname: {e}")

    if not addrinfo:
        raise UnsafeUrlError("Hostname did not resolve to any address")

    for family, _, _, _, sockaddr in addrinfo:
        ip = ipaddress.ip_address(sockaddr[0])
        if _is_unsafe_ip(ip):
            raise UnsafeUrlError(f"URL resolves to a disallowed address ({ip})")

    return hostname
