<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>IMAS Sitemap — app.inventora.store</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="XML sitemap for app.inventora.store (IMAS). This page is a human-friendly view of the sitemap; search engines read the XML directly." />
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #111; }
          h1 { font-size: 22px; margin: 0 0 8px; }
          p { margin: 0 0 16px; color: #444; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border-bottom: 1px solid #eee; padding: 10px 8px; text-align: left; vertical-align: top; }
          th { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #555; }
          a { color: #0b57d0; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { background: #f6f8fa; padding: 2px 6px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>IMAS Sitemap</h1>
        <p>
          This is a human-friendly view of <code>/sitemap.xml</code>. Search engines use the XML.
        </p>
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Last modified</th>
              <th>Changefreq</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td>
                  <a>
                    <xsl:attribute name="href"><xsl:value-of select="s:loc"/></xsl:attribute>
                    <xsl:value-of select="s:loc"/>
                  </a>
                </td>
                <td><xsl:value-of select="s:lastmod"/></td>
                <td><xsl:value-of select="s:changefreq"/></td>
                <td><xsl:value-of select="s:priority"/></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
