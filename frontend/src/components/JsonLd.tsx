import Script from 'next/script'

interface JsonLdProps {
  data: Record<string, unknown>
}

export default function JsonLd({ data }: JsonLdProps) {
  if (!data || Object.keys(data).length === 0) {
    return null
  }

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          ...data
        })
      }}
    />
  )
}
