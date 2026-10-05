export function getHubHomeHref() {
  const currentPage = new URL(window.location.href)
  currentPage.hash = ''
  currentPage.search = ''
  return new URL('../', currentPage).href
}

export function getSqlVisualLabHref() {
  return new URL('sql-visual-lab/', document.baseURI).pathname
}

export function getLinuxLabHref() {
  return new URL('linux-lab/', document.baseURI).pathname
}
