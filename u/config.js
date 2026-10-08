// Waar de pagina haar vragen heen stuurt: de functie `u` van Tot Thuis, in
// hetzelfde project als de functie `test` (web/test/config.js). Een publiek
// adres, zoals in de app; er staat geen sleutel in. De pagina staat op
// totthuis.nl/u (u.html); uitnodiging_link_basis in de database en de DNS
// bepalen waar de link heen wijst. Op deze machine (localhost) praat de
// pagina met de lokale stack.
const lokaal = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname ?? '')

export const API = lokaal ? 'http://127.0.0.1:54321/functions/v1/u' : 'https://kfuholxgoayiniywfbzd.supabase.co/functions/v1/u'
