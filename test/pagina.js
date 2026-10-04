// §5.7 De pagina achter de testlink, als statische pagina (Mischa koos op
// 4 oktober voor een eigen domein: Supabase toont HTML van zijn eigen domein
// als platte tekst). Dit bestand is puur — geen DOM, geen netwerk — zodat
// tests/testpagina.test.ts het kan toetsen; index.html zet de DOM en de
// aanroep eromheen.
//
// Drie regels dragen deze pagina:
//   · Het token staat achter een # in de link. Een browser stuurt dat deel
//     nooit naar de host van de pagina; alleen de knop stuurt het, naar de
//     functie van SamenFiets.
//   · Reageren is de knop, niet het openen. Berichtenapps en filters openen
//     een link vanzelf om een voorbeeld te tonen; bij het laden gaat er niets
//     de deur uit.
//   · De uitnodiging voor de app komt op een rustig moment. Loopt er een
//     alarm van de rijder, dan staat er geen oproep om iets te downloaden, en
//     verder verschilt de pagina niet. De uitnodiging belooft alleen wat nu
//     waar is: niets over meldingen, niets over "door stil heen".

const TOKEN = /^[0-9a-f]{32}$/

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
 * de knop en de uitnodiging er staan. index.html zet alles via textContent
 * op de pagina — een naam komt nooit als HTML binnen.
 */
export function inhoud(staat) {
  switch (staat.soort) {
    case 'vraag':
      return {
        titel: 'Dit is een test van SamenFiets',
        alineas: ['Je bent opgegeven als vertrouwenspersoon. Tik op de knop om te laten zien dat dit bericht aankomt.'],
        knop: 'Het is aangekomen',
        uitnodiging: null,
      }
    case 'bezig':
      return { titel: 'Dit is een test van SamenFiets', alineas: ['Even geduld.'], knop: null, uitnodiging: null }
    case 'gereageerd':
      return {
        titel: 'Het is aangekomen',
        alineas: [`${staat.naam} ziet dat je gereageerd hebt. Je hoeft verder niets te doen.`],
        knop: null,
        uitnodiging: staat.alarmLoopt
          ? null
          : {
              titel: 'De app',
              tekst: 'Met de app van SamenFiets zie je bij een alarm waar zij is, kun je zeggen dat je ermee bezig bent, en kun je het alarm afsluiten.',
              link: staat.appLink,
              zonderLink: 'De app is er nog niet. Tot die tijd werkt deze pagina.',
            },
      }
    case 'ongeldig':
      return { titel: 'Deze testlink is niet meer geldig', alineas: ['Vraag haar om een nieuwe test.'], knop: null, uitnodiging: null }
    case 'storing':
      return { titel: 'Dat lukte niet', alineas: ['Probeer het zo nog eens.'], knop: 'Opnieuw', uitnodiging: null }
  }
  return { titel: 'Dat lukte niet', alineas: [], knop: null, uitnodiging: null }
}
