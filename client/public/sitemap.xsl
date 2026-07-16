<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>ChalkPicks Sitemap</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0f;
            color: #c8c8dc;
            padding: 2rem 1rem;
          }
          .header {
            max-width: 860px;
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .logo-text {
            font-size: 1.5rem;
            font-weight: 800;
            color: #00ff88;
            letter-spacing: -0.02em;
          }
          .subtitle {
            font-size: 0.85rem;
            color: rgba(200,200,220,0.5);
            margin-top: 0.2rem;
          }
          .count {
            margin-left: auto;
            font-size: 0.8rem;
            color: rgba(0,255,136,0.7);
            background: rgba(0,255,136,0.08);
            border: 1px solid rgba(0,255,136,0.2);
            padding: 0.3rem 0.75rem;
            border-radius: 999px;
          }
          table {
            width: 100%;
            max-width: 860px;
            margin: 0 auto;
            border-collapse: collapse;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(0,255,136,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          thead tr {
            background: rgba(0,255,136,0.06);
            border-bottom: 1px solid rgba(0,255,136,0.15);
          }
          th {
            text-align: left;
            padding: 0.75rem 1rem;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(0,255,136,0.7);
          }
          td {
            padding: 0.65rem 1rem;
            font-size: 0.85rem;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: middle;
          }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: rgba(0,255,136,0.03); }
          a {
            color: #00ff88;
            text-decoration: none;
          }
          a:hover { text-decoration: underline; }
          .priority-high { color: #00ff88; font-weight: 600; }
          .priority-mid { color: rgba(200,200,220,0.7); }
          .priority-low { color: rgba(200,200,220,0.4); }
          .back {
            display: block;
            max-width: 860px;
            margin: 1.5rem auto 0;
            font-size: 0.8rem;
            color: rgba(200,200,220,0.4);
            text-align: center;
          }
          .back a { color: rgba(0,255,136,0.6); }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-text">⚡ ChalkPicks</div>
            <div class="subtitle">XML Sitemap — all public pages indexed for search engines</div>
          </div>
          <div class="count">
            <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Priority</th>
              <th>Change Freq</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <xsl:sort select="sitemap:priority" order="descending" data-type="number"/>
              <tr>
                <td>
                  <a href="{sitemap:loc}">
                    <xsl:value-of select="sitemap:loc"/>
                  </a>
                </td>
                <td>
                  <xsl:variable name="p" select="number(sitemap:priority)"/>
                  <span>
                    <xsl:attribute name="class">
                      <xsl:choose>
                        <xsl:when test="$p >= 0.9">priority-high</xsl:when>
                        <xsl:when test="$p >= 0.7">priority-mid</xsl:when>
                        <xsl:otherwise>priority-low</xsl:otherwise>
                      </xsl:choose>
                    </xsl:attribute>
                    <xsl:value-of select="sitemap:priority"/>
                  </span>
                </td>
                <td><xsl:value-of select="sitemap:changefreq"/></td>
                <td><xsl:value-of select="sitemap:lastmod"/></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
        <p class="back">
          <a href="/">← Back to ChalkPicks</a>
        </p>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
