// §5.7 De pagina achter de testlink, als statische pagina (Mischa koos op
// 4 oktober voor een eigen domein: Supabase toont HTML van zijn eigen domein
// als platte tekst). Dit bestand is puur — geen DOM, geen netwerk — zodat
// tests/testpagina-statisch.test.ts het kan toetsen; t.html zet de DOM en de
// aanroep eromheen.
//
// Drie regels dragen deze pagina:
//   · Het token staat achter een # in de link. Een browser stuurt dat deel
//     nooit naar de host van de pagina; alleen de knop stuurt het, naar de
//     functie van Tot Thuis.
//   · Reageren is de knop, niet het openen. Berichtenapps en filters openen
//     een link vanzelf om een voorbeeld te tonen; bij het laden gaat er niets
//     de deur uit.
//   · De uitnodiging voor de app komt op een rustig moment. Loopt er een
//     alarm van de rijder, dan staat er geen oproep om iets te downloaden, en
//     verder verschilt de pagina niet. De uitnodiging belooft alleen wat nu
//     waar is: niets over meldingen, niets over "door stil heen".

const TOKEN = /^[0-9a-f]{32}$/

/** Naar de voorpagina: wie hier zonder geldige link komt, ziet waar de pagina bij hoort. */
const VERDER = { tekst: 'Meer over Tot Thuis', href: './' }

/** Het token uit het #-deel van de link, of null als het er niet is of niet klopt. */
export function tokenUitHash(hash) {
  const token = (hash ?? '').replace(/^#/, '').trim().toLowerCase()
  return TOKEN.test(token) ? token : null
}

/** Wat het antwoord van de functie betekent voor de pagina. */
export function staatNaAntwoord(status, body) {
  if (status === 200 && body && typeof body.naam === 'string') {
    return {
      soort: 'gereageerd',
      naam: body.naam,
      alarmLoopt: body.alarm_loopt === true,
      appLink: typeof body.app_link === 'string' && /^https:\/\//.test(body.app_link) ? body.app_link : null,
    }
  }
  if (status === 404) return { soort: 'ongeldig' }
  return { soort: 'storing' }
}

/**
 * De inhoud van de pagina per staat, als platte tekst: titel, alinea's, en of
 * de knop, de uitnodiging en de link naar de voorpagina er staan. t.html zet alles via textContent
 * op de pagina — een naam komt nooit als HTML binnen.
 */
export function inhoud(staat) {
  switch (staat.soort) {
    case 'vraag':
      return {
        titel: 'Dit is een test van Tot Thuis',
        alineas: ['Je bent opgegeven als vertrouwenspersoon. Tik op de knop om te laten zien dat dit bericht aankomt.'],
        knop: 'Het is aangekomen',
        uitnodiging: null,
        verder: null,
      }
    case 'bezig':
      return { titel: 'Dit is een test van Tot Thuis', alineas: ['Even geduld.'], knop: null, uitnodiging: null, verder: null }
    case 'gereageerd':
      return {
        titel: 'Het is aangekomen',
        alineas: [`${staat.naam} ziet dat je gereageerd hebt. Je hoeft verder niets te doen.`],
        knop: null,
        uitnodiging: staat.alarmLoopt
          ? null
          : {
              titel: 'De app',
              tekst: 'Met de app Tot Thuis zie je bij een alarm waar zij is, kun je zeggen dat je ermee bezig bent, en kun je het alarm afsluiten.',
              link: staat.appLink,
              zonderLink: 'De app is er nog niet. Tot die tijd werkt deze pagina.',
            },
        verder: null,
      }
    case 'geen_token':
      return {
        titel: 'Deze pagina hoort bij een test van Tot Thuis',
        alineas: [
          'Wie Tot Thuis gebruikt, kiest een paar vertrouwenspersonen en kan hen een test sturen. Die test is een sms met een link naar deze pagina.',
          'Kwam je hier via zo’n sms, open dan de hele link uit het bericht nog eens. Zonder die link is hier niets te doen.',
        ],
        knop: null,
        uitnodiging: null,
        verder: VERDER,
      }
    case 'ongeldig':
      return {
        titel: 'Deze testlink is niet meer geldig',
        alineas: ['Een testlink werkt een beperkte tijd. Vraag degene die hem stuurde om een nieuwe test.'],
        knop: null,
        uitnodiging: null,
        verder: VERDER,
      }
    case 'storing':
      return { titel: 'Dat lukte niet', alineas: ['Probeer het zo nog eens.'], knop: 'Opnieuw', uitnodiging: null, verder: null }
  }
  return { titel: 'Dat lukte niet', alineas: [], knop: null, uitnodiging: null, verder: null }
}
