// Waar de knop de reactie heen stuurt: de functie `test` van SamenFiets.
// Een publiek adres, zoals in de app; er staat geen sleutel in. Verhuist de
// pagina naar een eigen SamenFiets-domein, dan blijft dit gelijk — alleen
// test_link_basis in de database en de DNS veranderen. Op deze machine
// (localhost) praat de pagina met de lokale stack.
const lokaal = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname ?? '')

export const API = lokaal ? 'http://127.0.0.1:54321/functions/v1/test' : 'https://kfuholxgoayiniywfbzd.supabase.co/functions/v1/test'
