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
    "platform.css",
    "data/brandConfig.mjs",
    "data/commerce.mjs",
    "kits/commerce.mjs",
    "kits/index.html",
    "kits/video-pronto/index.html",
    "kits/video-pronto/amostra/index.html",
    "ferramentas/index.html",
    "ferramentas/motion-lab/index.html",
    "ferramentas/motion-lab/lab.css",
    "ferramentas/motion-lab/app.mjs",
    "ferramentas/motion-lab/products.mjs",
    "assets/motion-lab/guarana-jesus.png",
    "assets/motion-lab/cheetos-mix.png",
    "assets/motion-lab/cheetos-lua.png",
    "assets/motion-lab/cachorrinho.png",
    "assets/motion-lab/andre-retrato.png",
    "assets/motion-lab/andre-corpo.png",
    "ferramentas/brief-para-video/index.html",
    "ferramentas/brief-para-video/engine.mjs",
    "ferramentas/brief-para-video/app.mjs",
    "ferramentas/arquiteto-de-escopo/index.html",
    "ferramentas/arquiteto-de-escopo/app.mjs",
    "ferramentas/scout/index.html",
    "ferramentas/scout/scout.css",
    "ferramentas/scout/app.mjs",
    "ferramentas/scout/dados.mjs",
    "ferramentas/auditor-ia/index.html",
    "ferramentas/auditor-ia/auditor-ia.css",
    "ferramentas/auditor-ia/app.mjs",
    "ferramentas/auditor-ia/financial-engine.mjs",
    "ferramentas/auditor-ia/fallback-analyst.mjs",
    "ferramentas/auditor-ia/presets.mjs",
    "ferramentas/auditor-ia/xlsx-codec.mjs",
    "assets/recursos/checklist-briefing.md",
    "assets/recursos/checklist-briefing.pdf",
    "assets/automotive.png",
    "assets/hero-video.mp4",
    "assets/in_the_nuvens.jpg",
    "assets/object_disassembling.mp4",
    "assets/object_disassembling.webm",
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
    "assets/optimized/blog-anuncios-concorrentes-cover.jpg",
    "assets/optimized/blog-ia-whatsapp-business-cover.jpg",
    "assets/optimized/automotive.jpg",
    "assets/optimized/in-the-nuvens.jpg",
    "assets/optimized/lead-flow-studio-crm.png",
    "assets/optimized/logo-96.png",
    "assets/optimized/objeto-em-camadas-poster.jpg",
    "assets/optimized/omniagent-ai-flow.png",
    "assets/optimized/omniagent-ai-hero.png",
    "assets/optimized/real-estate.jpg",
    "assets/optimized/saas-showcase-dark.png",
    "assets/optimized/showcase-ai.jpg",
    "assets/optimized/showcase-cinematic.jpg",
    "assets/optimized/showcase-web.jpg",
    "blog/index.html",
    "blog/como-preparar-material-para-edicao-de-video/index.html",
    "blog/ia-do-whatsapp-business-o-que-ela-resolve/index.html",
    "blog/como-ver-anuncios-dos-concorrentes/index.html",
    "cases/cardapio-digital/index.html",
    "cases/in-the-nuvens/index.html",
    "cases/lead-flow-studio/index.html",
    "cases/mundo-em-evolucao/index.html",
    "cases/nexus-bi-finance/index.html",
    "cases/objeto-em-camadas/index.html",
    "cases/omniagent-ai-studio/index.html",
    "contato/index.html",
    "contato/briefing.js",
    "contato/briefing.css",
    "data/projectData.js",
    "demo/app.js",
    "demo/index.html",
    "demo/style.css",
    "demo/crm.css",
    "demo/crm.js",
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

PRIVATE_PARTS = {
    "content", "paid", "private", "kits-pagos", "ativos-pagos", "docs", "deploy",
    "scripts", "api", "server", "workers", "node_modules", "tmp", "build", ".git", ".codex", ".agents",
}
PRIVATE_SUFFIXES = {".key", ".pem", ".sql", ".bak", ".zip"}


def validate_public_paths(source_root: Path, allowed_files: tuple[str, ...]) -> None:
    """Fail closed even if a private path is accidentally added to the allowlist."""
    if len(set(allowed_files)) != len(allowed_files):
        raise ValueError("Duplicate public allowlist path")
    root = source_root.resolve()
    for relative in allowed_files:
        path = Path(relative)
        parts = tuple(part.lower() for part in path.parts)
        if (path.is_absolute() or ".." in parts or not parts
                or any(part in PRIVATE_PARTS for part in parts)
                or any(part.startswith(".") and part != ".well-known" for part in parts)
                or path.suffix.lower() in PRIVATE_SUFFIXES
                or path.name.lower() in {"roadmap_estrategico.md", "agents.md", "claude.md", "skill.md"}):
            raise ValueError(f"Private or unsafe path in public allowlist: {relative}")
        candidate = source_root / path
        # A public-looking symlink must never smuggle private files into the build.
        for length in range(1, len(path.parts) + 1):
            if (source_root.joinpath(*path.parts[:length])).is_symlink():
                raise ValueError(f"Symlink is not allowed in public sources: {relative}")
        if root not in candidate.resolve().parents:
            raise ValueError(f"Source escapes the public source root: {relative}")


def copy_allowlist(source_root: Path, output: Path, allowed_files: tuple[str, ...]) -> list[str]:
    validate_public_paths(source_root, allowed_files)
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
    validate_public_paths(source_root, allowed_files)
    if output.resolve() == source_root.resolve() or output.resolve() in source_root.resolve().parents:
        raise ValueError("Build output must not replace the source root or its parents")
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
        (fixture / "content/paid/video-pronto").mkdir(parents=True)
        (fixture / "content/paid/video-pronto/material.md").write_text("PAID_SECRET", encoding="utf-8")
        (fixture / ".env.local").write_text("AI_API_KEY=SECRET_FIXTURE", encoding="utf-8")
        allowed = ("404.html", "style.css", "_headers", ".well-known/security.txt")
        output.mkdir(parents=True)
        (output / "stale-internal.txt").write_text("must be removed", encoding="utf-8")
        build(fixture, output, Path(temporary) / "inventory.json", allowed)
        forbidden = [output / "docs/internal-report.md", output / "tmp/backup.html", output / "content/paid/video-pronto/material.md", output / ".env.local"]
        if any(path.exists() for path in forbidden) or (output / "stale-internal.txt").exists():
            raise AssertionError("Fixture proved an internal or stale file entered the package")

        for forbidden_path in ("content/paid/video-pronto/material.md", ".env.local", "../secret.txt", "assets/paid/lesson.pdf", "ROADMAP_ESTRATEGICO.md"):
            try:
                build(fixture, output, Path(temporary) / "inventory.json", (*allowed, forbidden_path))
            except ValueError:
                pass
            else:
                raise AssertionError(f"Build accepted a forbidden allowlist entry: {forbidden_path}")
        (fixture / "leaked.md").symlink_to(fixture / "content/paid/video-pronto/material.md")
        try:
            build(fixture, output, Path(temporary) / "inventory.json", (*allowed, "leaked.md"))
        except ValueError:
            pass
        else:
            raise AssertionError("Build accepted a symlink to paid content")

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
