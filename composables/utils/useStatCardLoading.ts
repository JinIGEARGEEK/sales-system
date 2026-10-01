import type { InjectionKey, Ref } from 'vue'

const statCardLoadingKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('statCardLoading')

// Lets a grid of CrmStatCards share one loading flag (e.g. the Dashboard's
// KPI grid while GET /dashboard/summary is pending) without repeating
// `:loading` on every card. A card's own `loading` prop still works alone.
export const provideStatCardLoading = (loading: Readonly<Ref<boolean>>) => provide(statCardLoadingKey, loading)

export const injectStatCardLoading = (): Readonly<Ref<boolean>> => inject(statCardLoadingKey, ref(false))
