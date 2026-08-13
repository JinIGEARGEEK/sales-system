interface Loading {
  isDisable: boolean
}

export const useLoadingStore = defineStore('loading', {
  state: (): Loading => {
    return {
      isDisable: false,
    }
  },
  actions: {
    enable () {
      this.isDisable = false
    },
    disable () {
      this.isDisable = true
    },
  },
})
