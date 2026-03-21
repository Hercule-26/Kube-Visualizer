import { animate } from 'animejs'

const MIN_SCALE = 0.2
const MAX_SCALE = 3
const CLICK_THRESHOLD_PX = 4

export function useViewport(container: Ref<HTMLElement | null>) {
  const x = ref(0)
  const y = ref(0)
  const scale = ref(1)
  const panning = ref(false)

  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let originX = 0
  let originY = 0
  let moved = 0
  let captured = false
  let currentAnimation: ReturnType<typeof animate> | null = null

  function stopAnimation(): void {
    currentAnimation?.pause()
    currentAnimation = null
  }

  function animateTo(targetX: number, targetY: number, targetScale: number): void {
    stopAnimation()

    const proxy = { x: x.value, y: y.value, scale: scale.value }

    currentAnimation = animate(proxy, {
      x: targetX,
      y: targetY,
      scale: targetScale,
      duration: 420,
      ease: 'outCubic',
      onUpdate: () => {
        x.value = proxy.x
        y.value = proxy.y
        scale.value = proxy.scale
      },
    })
  }

  function clampScale(value: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
  }

  function zoomAt(clientX: number, clientY: number, factor: number): void {
    const box = container.value?.getBoundingClientRect()

    if (!box) {
      return
    }

    stopAnimation()

    const next = clampScale(scale.value * factor)

    if (next === scale.value) {
      return
    }

    const pointX = clientX - box.left
    const pointY = clientY - box.top

    x.value = pointX - ((pointX - x.value) / scale.value) * next
    y.value = pointY - ((pointY - y.value) / scale.value) * next
    scale.value = next
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault()

    const intensity = event.deltaMode === 1 ? 0.05 : 0.0016

    zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * intensity))
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return
    }

    stopAnimation()
    pointerId = event.pointerId
    panning.value = true
    captured = false
    moved = 0
    startX = event.clientX
    startY = event.clientY
    originX = x.value
    originY = y.value
  }

  function onPointerMove(event: PointerEvent): void {
    if (!panning.value || event.pointerId !== pointerId) {
      return
    }

    const dx = event.clientX - startX
    const dy = event.clientY - startY

    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy))

    if (!captured && moved > CLICK_THRESHOLD_PX) {
      ; (event.currentTarget as Element).setPointerCapture?.(event.pointerId)
      captured = true
    }

    x.value = originX + dx
    y.value = originY + dy
  }

  function onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== pointerId) {
      return
    }

    panning.value = false
    pointerId = null

    if (captured) {
      ; (event.currentTarget as Element).releasePointerCapture?.(event.pointerId)
      captured = false
    }
  }

  function wasDragged(): boolean {
    return moved > CLICK_THRESHOLD_PX
  }

  function zoomFromCenter(factor: number): void {
    const box = container.value?.getBoundingClientRect()

    if (!box) {
      return
    }

    const next = clampScale(scale.value * factor)

    if (next === scale.value) {
      return
    }

    const pointX = box.width / 2
    const pointY = box.height / 2

    animateTo(
      pointX - ((pointX - x.value) / scale.value) * next,
      pointY - ((pointY - y.value) / scale.value) * next,
      next,
    )
  }

  function zoomIn(): void {
    zoomFromCenter(1.35)
  }

  function zoomOut(): void {
    zoomFromCenter(1 / 1.35)
  }

  function fit(width: number, height: number, padding = 60): void {
    const box = container.value?.getBoundingClientRect()

    if (!box || width <= 0 || height <= 0) {
      return
    }

    const next = clampScale(
      Math.min(
        1,
        (box.width - padding * 2) / width,
        (box.height - padding * 2) / height,
      ),
    )

    animateTo(
      (box.width - width * next) / 2,
      (box.height - height * next) / 2,
      next,
    )
  }

  return {
    x,
    y,
    scale,
    panning,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    wasDragged,
    zoomIn,
    zoomOut,
    fit,
  }
}
