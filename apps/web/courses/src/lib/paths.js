function getCourseAppBaseUrl() {
  const currentPage = new URL(window.location.href)
  currentPage.hash = ''
  currentPage.search = ''

  const routeStart = currentPage.pathname.search(/\/(?:course|study|quiz|results)(?:\/|$)/)
  if (routeStart >= 0) {
    currentPage.pathname = `${currentPage.pathname.slice(0, routeStart)}/`
  } else if (!currentPage.pathname.endsWith('/')) {
    currentPage.pathname = `${currentPage.pathname.slice(0, currentPage.pathname.lastIndexOf('/') + 1)}`
  }
  return currentPage
}

export function getHubHomeHref() {
  return new URL('../', getCourseAppBaseUrl()).href
}

export function getSqlVisualLabHref() {
  return new URL('sql-visual-lab/', getCourseAppBaseUrl()).pathname
}

export function getLinuxLabHref() {
  return new URL('linux-lab/', getCourseAppBaseUrl()).pathname
}
