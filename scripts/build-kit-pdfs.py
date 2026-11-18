#!/usr/bin/env python3
"""Optional editorial helper. Requires reportlab, not used by the public site build."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='StudioTitle', fontName='Helvetica-Bold', fontSize=25, leading=30, spaceAfter=18))
styles.add(ParagraphStyle(name='StudioH2', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=colors.HexColor('#b3101b'), spaceBefore=15, spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle(name='StudioH3', fontName='Helvetica-Bold', fontSize=11, leading=14, spaceBefore=10, spaceAfter=6, keepWithNext=True))
styles.add(ParagraphStyle(name='StudioBody', fontName='Helvetica', fontSize=10.5, leading=15, spaceAfter=7))
styles.add(ParagraphStyle(name='StudioList', parent=styles['StudioBody'], leftIndent=12, firstLineIndent=-9))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#dedede'))
    canvas.line(42, 42, A4[0] - 42, 42)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#555555'))
    canvas.drawString(42, 29, 'AndreStudio.dev | Planejamento e produção audiovisual')
    canvas.drawRightString(A4[0] - 42, 29, str(doc.page))
    canvas.restoreState()


def main():
    for source, destination in [
        ('assets/recursos/checklist-briefing.md', 'assets/recursos/checklist-briefing.pdf'),
        ('content/paid/video-pronto/GUIA_VIDEO_PRONTO.md', 'content/paid/video-pronto/GUIA_VIDEO_PRONTO.pdf'),
    ]:
        flow = []
        for line in (ROOT / source).read_text(encoding='utf-8').splitlines():
            if not line.strip():
                continue
            if line.startswith('# '):
                text, style = line[2:], 'StudioTitle'
            elif line.startswith('## '):
                text, style = line[3:], 'StudioH2'
            elif line.startswith('### '):
                text, style = line[4:], 'StudioH3'
            elif line.startswith('- [ ] '):
                text, style = '[ ] ' + line[6:], 'StudioList'
            elif line.startswith('- '):
                text, style = line, 'StudioList'
            else:
                text, style = line, 'StudioBody'
            for original, replacement in [('→', '>'), ('–', '-'), ('—', '-'), ('’', "'"), ('“', '"'), ('”', '"')]:
                text = text.replace(original, replacement)
            flow.append(Paragraph(escape(text), styles[style]))
        document = SimpleDocTemplate(str(ROOT / destination), pagesize=A4, rightMargin=46, leftMargin=46,
                                     topMargin=42, bottomMargin=54, author='AndreStudio.dev',
                                     title='Vídeo Pronto para Produzir' if 'paid' in destination else 'Checklist de briefing', invariant=1)
        document.build(flow, onFirstPage=footer, onLaterPages=footer)
        print(destination)


if __name__ == '__main__':
    main()
