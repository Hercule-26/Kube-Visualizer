export type PodPhase =
  | 'Pending'
  | 'Running'
  | 'Succeeded'
  | 'Failed'
  | 'Unknown'
  | 'Terminating'
  | 'CrashLoopBackOff'