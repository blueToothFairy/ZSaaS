export class PermanentVibeScanError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'PermanentVibeScanError'; }
}

export class RetryableVibeScanError extends Error {
  constructor(message: string) { super(message); this.name = 'RetryableVibeScanError'; }
}

export class VibeScanQueueLimitError extends Error {
  constructor() { super('Too many Vibe Scan jobs are already in progress'); this.name = 'VibeScanQueueLimitError'; }
}

export class VibeScanMusicTasteRequiredError extends Error {
  constructor() { super('Set up your music taste before requesting personalized recommendations'); this.name = 'VibeScanMusicTasteRequiredError'; }
}
