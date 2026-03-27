export function useAppToast() {
  const toast = useToast()

  function warn(title: string, description: string): void {
    toast.add({
      title,
      description,
      color: 'warning',
      icon: 'i-lucide-triangle-alert',
    })
  }

  function fail(title: string, description: string): void {
    toast.add({
      title,
      description,
      color: 'error',
      icon: 'i-lucide-circle-alert',
    })
  }

  function ok(title: string, description: string): void {
    toast.add({
      title,
      description,
      color: 'success',
      icon: 'i-lucide-check',
    })
  }

  return { warn, fail, ok }
}
