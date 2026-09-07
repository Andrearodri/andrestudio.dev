#!/usr/bin/env python3
"""Serve build/public and apply the local Cloudflare Pages _headers rules.

This is a dependency-free local validator. It is not a production replacement
for Cloudflare Pages or Nginx.
"""

from __future__ import annotations

import argparse
import fnmatch
import re
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]


def parse_headers_file(path: Path) -> list[tuple[str, dict[str, str]]]:
    rules: list[tuple[str, dict[str, str]]] = []
    current_path: str | None = None
    current_headers: dict[str, str] = {}
    in_block = False
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line == "*/":
            in_block = False
            continue
        if line == "/*":
            if current_path is not None:
                rules.append((current_path, current_headers))
            current_path, current_headers, in_block = "/*", {}, True
            continue
        if in_block and ":" in line:
            name, value = line.split(":", 1)
            current_headers[name.strip()] = value.strip()
            continue
        if re.match(r"^[^\s].*$", line) and ":" not in line:
            if current_path is not None:
                rules.append((current_path, current_headers))
            current_path, current_headers = line, {}
            continue
        if current_path is not None and ":" in line:
            name, value = line.split(":", 1)
            current_headers[name.strip()] = value.strip()
    if current_path is not None:
        rules.append((current_path, current_headers))
    return rules


def matching_headers(rules: list[tuple[str, dict[str, str]]], request_path: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for pattern, headers in rules:
        if pattern == "/*" or fnmatch.fnmatch(request_path, pattern):
            result.update(headers)
    return result


class HeaderAwareHandler(SimpleHTTPRequestHandler):
    server_version = "PublicPackageValidator/1.0"

    def __init__(self, *args, directory: str, header_rules: list[tuple[str, dict[str, str]]], **kwargs):
        self.header_rules = header_rules
        super().__init__(*args, directory=directory, **kwargs)

    def _apply_headers(self) -> None:
        request_path = urlsplit(unquote(self.path)).path
        for name, value in matching_headers(self.header_rules, request_path).items():
            self.send_header(name, value)

    def send_head(self):  # noqa: N802 - stdlib hook name
        path = Path(self.translate_path(self.path))
        if path.is_dir():
            index = path / "index.html"
            if index.is_file():
                path = index
        if not path.is_file():
            self.send_response(HTTPStatus.NOT_FOUND)
            self._apply_headers()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            return None
        self.send_response(HTTPStatus.OK)
        self._apply_headers()
        content_type = self.guess_type(str(path))
        self.send_header("Content-type", content_type)
        self.send_header("Content-Length", str(path.stat().st_size))
        self.end_headers()
        return path.open("rb")

    def log_message(self, format: str, *args) -> None:
        print("%s - %s" % (self.address_string(), format % args))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=ROOT / "build" / "public")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    directory = args.directory.resolve()
    rules = parse_headers_file(directory / "_headers")
    handler = lambda *handler_args, **handler_kwargs: HeaderAwareHandler(
        *handler_args, directory=str(directory), header_rules=rules, **handler_kwargs
    )
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"Serving {directory} on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
