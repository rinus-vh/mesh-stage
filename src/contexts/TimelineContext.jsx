import { createContext, useContext } from 'react'

export const selKey = (trackId, keyframeId) => `${trackId}::${keyframeId}`

export const TimelineContext = createContext(null)

export function useTimelineContext() {
  return useContext(TimelineContext)
}
