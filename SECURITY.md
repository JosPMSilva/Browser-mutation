# Security Policy

## Supported Versions

Security fixes are handled on the default branch until versioned releases are published.

## Reporting A Vulnerability

Report security issues privately to the repository owner.

Do not open a public issue for vulnerabilities involving local proxy behavior, token handling, or unintended access to non-local targets.

## Security Model

Browser Mutation is intended for loopback/local development pages only.

The collector rejects non-loopback proxy targets. The browser overlay communicates with the local collector using a per-process token.

Do not expose the collector port to a public network.
