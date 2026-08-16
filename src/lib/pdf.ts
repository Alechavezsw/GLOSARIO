import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export type PdfSection = {
  heading?: string
  body: string
}

function slugFilename(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'ficha'
  )
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** PDF tipográfico independiente del CSS de la app (evita oklab/oklch de Tailwind). */
export async function downloadSectionsPdf(opts: {
  title: string
  subtitle?: string
  filename?: string
  sections: PdfSection[]
}) {
  const { title, subtitle, sections } = opts
  const filename = slugFilename(opts.filename || title)

  const sectionsHtml = sections
    .filter((s) => s.body.trim())
    .map((s) => {
      const h = s.heading
        ? `<h2>${escapeHtml(s.heading)}</h2>`
        : ''
      const paras = escapeHtml(s.body)
        .split(/\n+/)
        .map((p) => `<p>${p}</p>`)
        .join('')
      return `${h}${paras}`
    })
    .join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #111111;
    background: #ffffff;
    padding: 28px 32px;
    width: 720px;
  }
  .brand {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c45c26;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 26px;
    font-weight: 600;
    line-height: 1.25;
    margin-bottom: 8px;
    color: #111111;
  }
  .sub {
    font-size: 13px;
    color: #555555;
    margin-bottom: 22px;
  }
  h2 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #666666;
    margin: 18px 0 8px;
  }
  p {
    font-size: 14px;
    line-height: 1.55;
    color: #222222;
    margin-bottom: 8px;
  }
  .foot {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #dddddd;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color: #888888;
  }
</style></head><body>
  <div class="brand">Acero y Roca · Glosario de Minería</div>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ''}
  ${sectionsHtml}
  <p class="foot">Material de consulta. No reemplaza el texto legal ni un informe profesional. ${new Date().toLocaleDateString('es-AR')}</p>
</body></html>`

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:760px;height:2000px;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)

  const idoc = iframe.contentDocument
  if (!idoc) {
    iframe.remove()
    throw new Error('No se pudo preparar el documento PDF')
  }
  idoc.open()
  idoc.write(html)
  idoc.close()

  // Esperar layout del iframe
  await new Promise((r) => window.setTimeout(r, 50))

  const body = idoc.body
  try {
    const canvas = await html2canvas(body, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: body.scrollWidth,
      height: body.scrollHeight,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 10
    const usableW = pageW - margin * 2
    const imgH = (canvas.height * usableW) / canvas.width
    const pageContentH = pageH - margin * 2

    let remaining = imgH
    let srcY = 0

    while (remaining > 0.5) {
      const sliceH = Math.min(remaining, pageContentH)
      const slicePx = Math.max(1, Math.round((sliceH / imgH) * canvas.height))
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = slicePx
      const ctx = sliceCanvas.getContext('2d')
      if (!ctx) break
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(
        canvas,
        0,
        Math.round(srcY),
        canvas.width,
        slicePx,
        0,
        0,
        canvas.width,
        slicePx,
      )
      const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.93)
      if (srcY > 0) pdf.addPage()
      pdf.addImage(sliceImg, 'JPEG', margin, margin, usableW, sliceH)
      remaining -= sliceH
      srcY += slicePx
    }

    pdf.save(`${filename}.pdf`)
  } finally {
    iframe.remove()
  }
}

/** @deprecated Usar downloadSectionsPdf — se mantiene por compatibilidad. */
export async function downloadFichaPdf(filenameBase: string) {
  const root = document.querySelector('.print-ficha') as HTMLElement | null
  const main = root?.querySelector('main') as HTMLElement | null
  if (!main) throw new Error('No hay ficha para exportar')

  const title =
    main.querySelector('h1')?.textContent?.trim() || filenameBase
  const subtitle =
    main.querySelector('p.text-\\[11px\\], p[class*="uppercase"]')
      ?.textContent?.trim() || undefined

  const sections: PdfSection[] = []
  main.querySelectorAll('section').forEach((sec) => {
    const heading = sec.querySelector('h2')?.textContent?.trim()
    const body = [...sec.querySelectorAll('p, li')]
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean)
      .join('\n')
    if (body) sections.push({ heading, body })
  })

  if (!sections.length) {
    const body = main.innerText.replace(/\s+\n/g, '\n').trim()
    sections.push({ body })
  }

  await downloadSectionsPdf({
    title,
    subtitle,
    filename: filenameBase,
    sections,
  })
}
