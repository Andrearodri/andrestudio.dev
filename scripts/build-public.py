#!/usr/bin/env python3
"""Build the deliberately allowlisted static package for the public host.

Usage:
  python3 scripts/build-public.py
  python3 scripts/build-public.py --self-test

The default output is build/public. The package is assembled from the explicit
file list below; source directories, Git metadata, backups and reports are
never traversed as a fallback.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "build" / "public"

# Deliberate publication allowlist. Keep additions reviewable and explicit.
ALLOWED_FILES = (
    "404.html",
    "_headers",
    "_redirects",
    ".well-known/security.txt",
    "home.css",
    "index.html",
    "logooficial.png",
    "robots.txt",
    "script.js",
    "site.webmanifest",
    "sitemap.xml",
    "style.css",
    "sobre.html",
    "theme.js",
    "assets/automotive.png",
    "assets/hero-video.mp4",
    "assets/in_the_nuvens.jpg",
    "assets/object_disassembling.mp4",
    "assets/real_estate.png",
    "assets/showcase_ai.jpg",
    "assets/showcase_cinematic.jpg",
    "assets/showcase_web.jpg",
    "assets/illustrations/automation/chatbot.svg",
    "assets/illustrations/automation/data-transfer.svg",
    "assets/illustrations/design/content-team.svg",
    "assets/illustrations/design/social-media.svg",
    "assets/illustrations/landing-pages/web-developer.svg",
    "assets/illustrations/systems/growth-analytics.svg",
    "assets/illustrations/systems/system-interface.svg",
    "assets/illustrations/video/code-thinking.svg",
    "assets/optimized/agenda-cheia-slz.png",
    "assets/optimized/andre-rodrigues.jpg",
    "assets/optimized/automotive.jpg",
    "assets/optimized/claude-code-256-cover.jpg",
    "assets/optimized/cloudflare-os-cover.png",
    "assets/optimized/gemini-3-7-flash-cover.jpg",
    "assets/optimized/github-copilot-review-cover.jpg",
    "assets/optimized/in-the-nuvens.jpg",
    "assets/optimized/lead-flow-studio-crm.png",
    "assets/optimized/logo-96.png",
    "assets/optimized/meta-muse-cover.jpg",
    "assets/optimized/omniagent-ai-flow.png",
    "assets/optimized/omniagent-ai-hero.png",
    "assets/optimized/real-estate.jpg",
    "assets/optimized/saas-showcase-dark.png",
    "assets/optimized/salesforce-agentforce-cover.jpg",
    "assets/optimized/showcase-ai.jpg",
    "assets/optimized/showcase-cinematic.jpg",
    "assets/optimized/showcase-web.jpg",
    "blog/index.html",
    "blog/claude-code-256-agentes-avaliacao-plugins/index.html",
    "blog/cloudflare-os-agentes-ia-empresas/index.html",
    "blog/como-preparar-material-para-edicao-de-video/index.html",
    "blog/github-copilot-code-review-equipe-agentes/index.html",
    "blog/google-gemini-3-6-flash/index.html",
    "blog/google-gemini-3-7-flash/index.html",
    "blog/grounding-with-parallel-foi-anunciado-oficialmente/index.html",
    "blog/meta-muse-agente-ia-whatsapp-secure-vm/index.html",
    "blog/radar-tech-do-chat-a-execucao-agentes-ia/index.html",
    "blog/salesforce-agentforce-agentes-dias-semanas/index.html",
    "cases/cardapio-digital/index.html",
    "cases/in-the-nuvens/index.html",
    "cases/lead-flow-studio/index.html",
    "cases/mundo-em-evolucao/index.html",
    "cases/nexus-bi-finance/index.html",
    "cases/objeto-em-camadas/index.html",
    "cases/omniagent-ai-studio/index.html",
    "contato/index.html",
    "data/projectData.js",
    "demo/app.js",
    "demo/index.html",
    "demo/style.css",
    "portfolio/index.html",
    "portfolio/agenda-cheia-slz-demo/app.js",
    "portfolio/agenda-cheia-slz-demo/index.html",
    "portfolio/agenda-cheia-slz-demo/styles.css",
    "portfolio/cardapio-digital-demo/app.js",
    "portfolio/cardapio-digital-demo/index.html",
    "portfolio/cardapio-digital-demo/style.css",
    "portfolio/cardapio-digital-demo/img/acai.png",
    "portfolio/cardapio-digital-demo/img/agua_mineral.png",
    "portfolio/cardapio-digital-demo/img/burger.png",
    "portfolio/cardapio-digital-demo/img/drinks.png",
    "portfolio/cardapio-digital-demo/img/fries.png",
    "portfolio/cardapio-digital-demo/img/nuggets.png",
    "portfolio/cardapio-digital-demo/img/onion_rings.png",
    "portfolio/cardapio-digital-demo/img/pizza.png",
    "portfolio/cardapio-digital-demo/img/pizza_margherita.png",
    "portfolio/cardapio-digital-demo/img/pizza_quatro_queijos.png",
    "portfolio/cardapio-digital-demo/img/smash_bacon_bbq.png",
    "portfolio/cardapio-digital-demo/img/smash_classico.png",
    "portfolio/cardapio-digital-demo/img/suco_natural.png",
    "portfolio/cardapio-digital-demo/img/wrap.png",
    "portfolio/cardapio-digital-demo/img/wrap_veggie.png",
    "portfolio/omniagent-ai-demo/app.js",
    "portfolio/omniagent-ai-demo/data.js",
    "portfolio/omniagent-ai-demo/index.html",
    "portfolio/omniagent-ai-demo/style.css",
    "privacidade/index.html",
    "servicos/automacao-com-ia/index.html",
    "servicos/edicao-de-video-profissional/index.html",
    "servicos/index.html",
    "servicos/sites-premium/index.html",
    "sobre/index.html",
)

LOCAL_REF_RE = re.compile(r"(?:src|href|poster)\s*=\s*(['\"])(.*?)\1", re.IGNORECASE)
CSS_URL_RE = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.IGNORECASE)


def copy_allowlist(source_root: Path, output: Path, allowed_files: tuple[str, ...]) -> list[str]:
    missing = []
    for relative in allowed_files:
        source = source_root / relative
        if not source.is_file():
            missing.append(relative)
            continue
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    if missing:
        raise FileNotFoundError("Allowlisted source files missing: " + ", ".join(missing))
    return list(allowed_files)


def is_external(reference: str) -> bool:
    parsed = urlsplit(reference)
    return (
        not reference
        or reference.startswith(("#", "//", "data:", "mailto:", "tel:", "javascript:"))
        or bool(parsed.scheme)
    )


def resolve_reference(package_root: Path, document: Path, reference: str) -> Path | None:
    if is_external(reference):
        return None
    path_part = urlsplit(reference).path
    candidate = package_root / path_part.lstrip("/") if path_part.startswith("/") else document.parent / path_part
    if candidate.is_dir():
        candidate = candidate / "index.html"
    elif not candidate.suffix and (candidate / "index.html").is_file():
        candidate = candidate / "index.html"
    return candidate


def validate_references(output: Path) -> list[str]:
    errors = []
    for document in output.rglob("*"):
        if not document.is_file() or document.suffix.lower() not in {".html", ".css"}:
            continue
        text = document.read_text(encoding="utf-8", errors="replace")
        references = LOCAL_REF_RE.findall(text) if document.suffix.lower() == ".html" else CSS_URL_RE.findall(text)
        for _, reference in references:
            target = resolve_reference(output, document, reference)
            if target is not None and not target.is_file():
                errors.append(f"{document.relative_to(output)} -> {reference}")
    if errors:
        raise RuntimeError("Broken local references:\n" + "\n".join(errors))
    return errors


def write_inventory(output: Path, inventory_path: Path, allowed_files: list[str]) -> None:
    files = []
    for relative in sorted(allowed_files):
        path = output / relative
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        files.append({"path": relative, "bytes": path.stat().st_size, "sha256": digest})
    inventory_path.parent.mkdir(parents=True, exist_ok=True)
    inventory_path.write_text(
        json.dumps({"package_root": str(output), "file_count": len(files), "files": files}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def validate_output_set(output: Path, allowed_files: list[str]) -> None:
    expected = {Path(relative).as_posix() for relative in allowed_files}
    actual = {path.relative_to(output).as_posix() for path in output.rglob('*') if path.is_file()}
    if actual != expected:
        extra = sorted(actual - expected)
        missing = sorted(expected - actual)
        details = []
        if extra:
            details.append('unexpected: ' + ', '.join(extra))
        if missing:
            details.append('missing: ' + ', '.join(missing))
        raise RuntimeError('Public output does not match the allowlist (' + '; '.join(details) + ')')


def build(source_root: Path, output: Path, inventory_path: Path, allowed_files: tuple[str, ...] = ALLOWED_FILES) -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    copied = copy_allowlist(source_root, output, allowed_files)
    validate_output_set(output, copied)
    validate_references(output)
    write_inventory(output, inventory_path, copied)
    print(f"Public package: {output}")
    print(f"Inventory: {inventory_path}")
    print(f"Files: {len(copied)}")


def run_self_test() -> None:
    with tempfile.TemporaryDirectory(prefix="public-package-fixture-") as temporary:
        fixture = Path(temporary) / "source"
        output = Path(temporary) / "public"
        (fixture / ".well-known").mkdir(parents=True)
        (fixture / "docs").mkdir()
        (fixture / "tmp").mkdir()
        (fixture / "404.html").write_text("<!doctype html><link rel=\"stylesheet\" href=\"/style.css\">", encoding="utf-8")
        (fixture / "style.css").write_text("body { color: red; }", encoding="utf-8")
        (fixture / "_headers").write_text("/\n  X-Test: fixture\n", encoding="utf-8")
        (fixture / ".well-known/security.txt").write_text("Contact: security@example.invalid\n", encoding="utf-8")
        (fixture / "docs/internal-report.md").write_text("internal", encoding="utf-8")
        (fixture / "tmp/backup.html").write_text("backup", encoding="utf-8")
        allowed = ("404.html", "style.css", "_headers", ".well-known/security.txt")
        output.mkdir(parents=True)
        (output / "stale-internal.txt").write_text("must be removed", encoding="utf-8")
        build(fixture, output, Path(temporary) / "inventory.json", allowed)
        forbidden = [output / "docs/internal-report.md", output / "tmp/backup.html"]
        if any(path.exists() for path in forbidden) or (output / "stale-internal.txt").exists():
            raise AssertionError("Fixture proved an internal or stale file entered the package")

        (fixture / "style.css").unlink()
        try:
            build(fixture, Path(temporary) / "missing-output", Path(temporary) / "missing-inventory.json", allowed)
        except FileNotFoundError as error:
            if "style.css" not in str(error):
                raise AssertionError("Missing allowlisted file failed without naming the path") from error
        else:
            raise AssertionError("Missing allowlisted file did not fail the build")
    print("Fixture self-test: PASS (internal/stale files excluded; missing allowlist fails)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--inventory", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        run_self_test()
        return
    inventory = args.inventory or args.output.parent / "public-inventory.json"
    build(args.source.resolve(), args.output.resolve(), inventory.resolve())


if __name__ == "__main__":
    main()
