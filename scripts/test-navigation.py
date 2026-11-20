#!/usr/bin/env python3
"""Check the published shared menus and their page/fragment destinations."""
from html.parser import HTMLParser
from pathlib import Path
import runpy
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = runpy.run_path(str(ROOT / 'scripts/build-public.py'))['ALLOWED_FILES']
EXPECTED = [
    ('Auditor IA', '/#auditor-ia'), ('Ferramentas', '/ferramentas/'),
    ('Kits', '/kits/'), ('Soluções', '/#solucoes'), ('Projetos', '/#projetos'),
    ('Sobre', '/sobre/'), ('Conteúdo', '/blog/'), ('Cursos', '/cursos/'),
    ('Assista', '/assista/'), ('Contato', '/contato/'),
]


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links, self.current = set(), [], []
        self.in_menu, self.anchor = False, None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'nav' and attrs.get('id') == 'primary-nav':
            self.in_menu = True
        if tag == 'a' and self.in_menu:
            self.anchor = [attrs.get('href'), '', attrs.get('aria-current')]

    def handle_data(self, data):
        if self.anchor is not None:
            self.anchor[1] += data

    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor is not None:
            href, label, current = self.anchor
            self.links.append((label.strip(), href))
            if current:
                self.current.append(href)
            self.anchor = None
        if tag == 'nav':
            self.in_menu = False


def main():
    count = 0
    for name in ALLOWED:
        if not name.endswith('.html'):
            continue
        page = Page((ROOT / name).read_text(encoding='utf-8'))
        if not page.links:
            continue  # Redirects and standalone demos retain their own controls.
        assert page.links == EXPECTED, f'{name}: inconsistent navigation'
        assert len(page.current) <= 1, f'{name}: multiple current pages'
        assert 'primary-nav' in page.ids, f'{name}: missing menu target'
        for _, href in page.links:
            url = urlsplit(href)
            target = ROOT / url.path.lstrip('/') / 'index.html'
            assert target.relative_to(ROOT).as_posix() in ALLOWED, f'{name}: unpublished {href}'
            if url.fragment:
                assert url.fragment in Page(target.read_text(encoding='utf-8')).ids, f'{name}: missing {href}'
        count += 1
    assert count == 43, f'Expected 43 public shared menus, found {count}'
    print(f'PASS: {count} consistent menus; all public destinations and fragments exist')


if __name__ == '__main__':
    main()
