import { Link } from 'react-router-dom'

export default function HashAnchorLink({ targetId, onClick, ...props }) {
  function handleClick(event) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
  }

  return <Link {...props} to={{ hash: `#${targetId}` }} onClick={handleClick} />
}
