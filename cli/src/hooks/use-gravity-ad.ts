
export type AdResponse = {
  adText: string
  title: string
  cta: string
  url: string
  favicon: string
  clickUrl: string
  impUrl: string
  credits?: number
}

export type GravityAdState = {
  ad: AdResponse | null
  isLoading: boolean
}

export const useGravityAd = (): GravityAdState => {
  return { ad: null, isLoading: false }
}
