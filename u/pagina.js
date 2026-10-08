// §5.5 De pagina achter de uitnodiging (/u), als statische pagina, zoals de
// testpagina (/t). Dit bestand is puur: geen DOM, geen netwerk, zodat
// tests/u-pagina.test.ts het kan toetsen; u.html zet de DOM en de aanroep
// eromheen, en stuurt alleen wat begin, naKnop en naAntwoord vragen.
//
// Vier regels dragen deze pagina:
//   · Het token staat achter een # in de link. Een browser stuurt dat deel
//     nooit naar de host van de pagina; alleen deze pagina stuurt het, in de
//     body, naar de functie u van Tot Thuis.
//   · Openen is geen antwoord. Bij het laden gaat er alleen een vraag om te
//     bekijken, en die verandert niets: berichtenapps openen een link vanzelf
//     voor een voorbeeld. Ook de link uit de controle-sms bevestigt pas op de
//     knop.
//   · Nee is definitief, dus de pagina vraagt het een keer na. Het antwoord
//     nee gaat pas na "Ja, ik wil dit niet".
//   · "Ja, ik weet ervan" is nog niet de ja: eerst de nummerstap. Het
//     antwoord ja gaat pas als zij het nummer bevestigde of haar eigen
//     nummer gaf en teruglas.

const TOKEN = /^[0-9a-f]{32}$/

/** Naar de voorpagina, onder elke pagina waar verder niets te doen is. */
const VERDER = { tekst: 'Meer over Tot Thuis', href: './' }

/** De uitkomsten van de controle-sms die de functie kent (api.ts). */
const CONTROLE_SMS = ['wordt_gestuurd', 'morgen', 'niet_nodig']

/** Per fout van haar eigen nummer een vaste zin; zij kan daarna opnieuw typen. */
const NUMMERFOUT = {
  nummer_ongeldig: () => 'Dit is geen Nederlands nummer. Typ het zoals 06 12 34 56 78.',
  nummer_van_rijder: (naam) => `Dit is het nummer van ${naam} zelf. Typ je eigen nummer.`,
  nummer_al_in_keten: (naam) => `Dit nummer staat al in de keten van ${naam}.`,
  nummer_geweigerd: (naam) => `Met dit nummer is al eens nee gezegd. Het kan niet meer in de keten van ${naam}.`,
}

/** Het token uit het #-deel van de link, of null als het er niet is of niet klopt. */
export function tokenUitHash(hash) {
  const token = (hash ?? '').replace(/^#/, '').trim().toLowerCase()
  return TOKEN.test(token) ? token : null
}

/** Zoals intern.formatteer_telefoon: een mobiel nummer in paren, een vast nummer met het netnummer apart. */
function formatteer(v) {
  if (/^\+316[0-9]{8}$/.test(v)) return `06 ${v.slice(4, 6)} ${v.slice(6, 8)} ${v.slice(8, 10)} ${v.slice(10, 12)}`
  return `0${v.slice(3, 5)} ${v.slice(5, 8)} ${v.slice(8, 12)}`
}

/**
 * Haar eigen nummer zoals de server het leest (intern.normaliseer_telefoon):
 * alleen een Nederlands nummer. Geeft het nummer zoals het verstuurd wordt
 * (+31...) en zoals zij het terugleest (06 12 34 56 78), of null. De server
 * blijft de maat: hij weigert zelf wat hier door zou glippen (P0015).
 */
export function leesNummer(invoer) {
  let v = String(invoer ?? '').replace(/[^0-9+]/g, '')
  if (v.startsWith('00')) v = `+${v.slice(2)}`
  else if (v.startsWith('0')) v = `+31${v.slice(1)}`
  if (/^\+310[0-9]{9}$/.test(v)) v = `+31${v.slice(4)}`
  if (!/^\+31[1-9][0-9]{8}$/.test(v)) return null
  return { nummer: v, gelezen: formatteer(v) }
}

/** Een stap: de nieuwe staat, en wat er de deur uit gaat (of null). */
function rust(staat) {
  return { staat, verzoek: null }
}
function vraag(staat, verzoek) {
  return { staat: { ...staat, bezig: true, wacht: verzoek }, verzoek }
}

/**
 * Het begin: zonder iets achter de # de uitleg; met iets dat geen token is
 * (afgekapt of verminkt) zegt de pagina dat de link niet werkt, zonder vraag;
 * met een token alleen bekijken.
 */
export function begin(hash) {
  const token = tokenUitHash(hash)
  if (token) return vraag({ soort: 'laden', token }, { token })
  if ((hash ?? '').replace(/^#/, '').trim() === '') return rust({ soort: 'geen_token' })
  return rust({ soort: 'onbekend' })
}

/** Een knop. Zolang er een vraag loopt, doet geen enkele knop iets. */
export function naKnop(staat, knop, invoer) {
  if (!staat || staat.bezig) return rust(staat)
  const { token, naam, nummer } = staat
  switch (`${staat.soort} ${knop}`) {
    case 'vraag ja_ik_weet_ervan':
      return vraag({ soort: 'vraag', token, naam }, { token, stap: 'nummer' })
    case 'vraag wil_niet':
      return rust({ soort: 'zeker', token, naam })
    case 'zeker zeker_wil_niet':
      return vraag({ soort: 'zeker', token, naam }, { token, antwoord: 'nee' })
    case 'zeker terug':
      return rust({ soort: 'vraag', token, naam })
    case 'nummer nummer_klopt':
      return vraag({ soort: 'nummer', token, naam, nummer }, { token, antwoord: 'ja', nummer_klopt: true })
    case 'nummer nummer_klopt_niet':
      return rust({ soort: 'eigen', token, naam, nummer, invoer: '', fout: null })
    case 'eigen verder': {
      const gelezen = leesNummer(invoer)
      if (!gelezen) return rust({ soort: 'eigen', token, naam, nummer, invoer: String(invoer ?? ''), fout: 'nummer_ongeldig' })
      return rust({ soort: 'teruglezen', token, naam, nummer, invoer: String(invoer), eigen: gelezen })
    }
    case 'eigen terug':
      return rust({ soort: 'nummer', token, naam, nummer })
    case 'teruglezen eigen_klopt':
      return vraag(
        { soort: 'teruglezen', token, naam, nummer, invoer: staat.invoer, eigen: staat.eigen },
        { token, antwoord: 'ja', nummer_klopt: false, eigen_telefoon: staat.eigen.nummer }
      )
    case 'teruglezen aanpassen':
      return rust({ soort: 'eigen', token, naam, nummer, invoer: staat.invoer, fout: null })
    case 'controle bevestig':
      return vraag({ soort: 'controle', token, naam }, { token, bereikbaar: true })
    case 'nog_niet_gecontroleerd stuur_sms':
      return vraag({ soort: 'nog_niet_gecontroleerd', token, naam }, { token, stap: 'controle' })
    case 'storing opnieuw':
      return vraag({ ...staat.terug, bezig: false, wacht: null }, staat.terug.wacht)
  }
  return rust(staat)
}

/** Waar een vraag om ging. */
function soortVan(verzoek) {
  if ('antwoord' in verzoek) return 'antwoord'
  if (verzoek.stap === 'nummer') return 'nummer'
  if (verzoek.stap === 'controle') return 'nummercontrole'
  if (verzoek.bereikbaar === true) return 'bereikbaar'
  return 'bekijk'
}

/** Het antwoord van de functie op de vraag die liep. Er gaat daarna niets vanzelf de deur uit. */
export function naAntwoord(staat, status, body) {
  if (!staat || !staat.bezig || !staat.wacht) return rust(staat)
  const v = staat.wacht
  const b = body !== null && typeof body === 'object' ? body : {}
  const naam = typeof b.naam === 'string' && b.naam.length > 0 ? b.naam : (staat.naam ?? 'je contact')
  const storing = rust({ soort: 'storing', terug: staat })
  // Bij het laden: een token dat de server niet kent. Daarna: de link verliep onderweg.
  if (status === 404) return rust({ soort: soortVan(v) === 'bekijk' ? 'onbekend' : 'verlopen' })
  if (status === 200 && b.uitkomst === 'al_beantwoord') return rust({ soort: 'beantwoord' })
  switch (soortVan(v)) {
    case 'bekijk':
      if (status !== 200) return storing
      if (b.status === 'onbekend') return rust({ soort: 'onbekend' })
      if (b.status === 'verlopen') return rust({ soort: 'verlopen' })
      if (b.status === 'open' && b.soort === 'deel') return rust({ soort: 'vraag', token: v.token, naam })
      if (b.status === 'open' && b.soort === 'controle') return rust({ soort: 'controle', token: v.token, naam })
      // Zij zei ja, maar er ging nog geen controle-sms: dan een knop om hem alsnog te vragen, en niets vanzelf.
      if (b.status === 'beantwoord' && b.soort === 'deel' && b.controle_mogelijk === true) return rust({ soort: 'nog_niet_gecontroleerd', token: v.token, naam })
      if (b.status === 'beantwoord' && b.soort === 'deel') return rust({ soort: 'beantwoord' })
      if (b.status === 'beantwoord' && b.soort === 'controle') return rust({ soort: 'bereikbaar', naam })
      return storing
    case 'nummer':
      if (status === 200 && typeof b.nummer === 'string' && b.nummer.length > 0) return rust({ soort: 'nummer', token: v.token, naam, nummer: b.nummer })
      return storing
    case 'antwoord':
      if (v.antwoord === 'nee') return status === 200 && b.uitkomst === 'nee' ? rust({ soort: 'weg', naam }) : storing
      if (status === 200 && b.uitkomst === 'ja' && CONTROLE_SMS.includes(b.controle_sms)) return rust({ soort: 'ja', naam, sms: b.controle_sms })
      if (status === 422 && v.nummer_klopt === false && Object.prototype.hasOwnProperty.call(NUMMERFOUT, b.code)) {
        return rust({ soort: 'eigen', token: v.token, naam, nummer: staat.nummer, invoer: staat.invoer, fout: b.code })
      }
      return storing
    case 'nummercontrole':
      if (status === 200 && CONTROLE_SMS.includes(b.uitkomst)) return rust({ soort: 'ja', naam, sms: b.uitkomst })
      return storing
    case 'bereikbaar':
      if (status === 200 && (b.uitkomst === 'bevestigd' || b.uitkomst === 'al_bevestigd')) return rust({ soort: 'bereikbaar', naam })
      return storing
  }
  return storing
}

const knop = (id, tekst, tweede = false) => ({ id, tekst, tweede })

/** Een lege pagina; elke staat vult alleen wat hij nodig heeft. */
const LEEG = { titel: '', alineas: [], opmerking: null, groot: null, vraag: null, fout: null, veld: null, knoppen: [], verder: null }

/**
 * De inhoud per staat, als platte tekst. u.html zet alles via textContent op
 * de pagina: een naam komt nooit als HTML binnen.
 */
export function inhoud(staat) {
  const naam = staat?.naam
  switch (staat?.soort) {
    case 'geen_token':
      return {
        ...LEEG,
        titel: 'Deze pagina hoort bij een uitnodiging van Tot Thuis',
        alineas: [
          'Wie Tot Thuis gebruikt, kiest een paar vertrouwenspersonen en stuurt hen zelf een link naar deze pagina. Hier zeg je of je dat wilt.',
          'Kwam je hier via zo’n link of een sms van Tot Thuis, open dan de hele link uit het bericht nog eens. Zonder die link is hier niets te doen.',
        ],
        verder: VERDER,
      }
    case 'laden':
      return { ...LEEG, titel: 'Even geduld' }
    case 'vraag':
      return {
        ...LEEG,
        titel: `${naam} vraagt of je vertrouwenspersoon wilt zijn`,
        alineas: [
          `${naam} gebruikt Tot Thuis als ze alleen naar huis fietst. Laat ze niet op tijd weten dat ze er is en reageert ze niet, dan stuurt Tot Thuis jou een bericht, zodat je haar kunt bellen. Bij een gewone rit sturen we je niets.`,
        ],
        opmerking: 'Staat je telefoon op stil, dan hoor je een alarm van Tot Thuis niet. Alleen je scherm licht op. Wil je ook ’s nachts bereikbaar zijn, laat het geluid dan aan.',
        vraag: 'Zeg je ja, dan sturen we je één sms om te controleren of je nummer werkt.',
        knoppen: [knop('ja_ik_weet_ervan', 'Ja, ik weet ervan'), knop('wil_niet', 'Ik wil dit niet', true)],
      }
    case 'zeker':
      return {
        ...LEEG,
        titel: 'Weet je het zeker?',
        alineas: [`${naam} kan je nummer daarna niet opnieuw toevoegen.`],
        knoppen: [knop('zeker_wil_niet', 'Ja, ik wil dit niet'), knop('terug', 'Terug', true)],
      }
    case 'weg':
      return {
        ...LEEG,
        titel: `Je nummer is uit de keten van ${naam}`,
        alineas: [`Tot Thuis stuurt je geen berichten meer over ${naam}.`],
        verder: VERDER,
      }
    case 'nummer':
      return {
        ...LEEG,
        titel: `${naam} gaf dit nummer voor je op`,
        groot: staat.nummer,
        vraag: 'Klopt dat?',
        knoppen: [knop('nummer_klopt', 'Ja, dit is mijn nummer'), knop('nummer_klopt_niet', 'Nee, dit klopt niet', true)],
      }
    case 'eigen':
      return {
        ...LEEG,
        titel: 'Wat is je nummer?',
        fout: staat.fout ? NUMMERFOUT[staat.fout](naam) : null,
        veld: { label: 'Je mobiele nummer', waarde: staat.invoer ?? '' },
        knoppen: [knop('verder', 'Verder'), knop('terug', 'Terug', true)],
      }
    case 'teruglezen':
      return {
        ...LEEG,
        titel: 'Klopt dit nummer?',
        groot: staat.eigen.gelezen,
        knoppen: [knop('eigen_klopt', 'Ja, dit nummer klopt'), knop('aanpassen', 'Nee, aanpassen', true)],
      }
    case 'ja':
      return {
        ...LEEG,
        titel: 'Dank je',
        alineas: [`${naam} ziet nu dat je ervan weet.`, ...naDeJa(staat.sms, naam)],
        verder: VERDER,
      }
    case 'controle':
      return {
        ...LEEG,
        titel: 'Deze sms kwam aan',
        alineas: [`Tik op de knop, dan ziet ${naam} dat Tot Thuis je kan bereiken.`],
        knoppen: [knop('bevestig', 'Het is aangekomen')],
      }
    case 'bereikbaar':
      return { ...LEEG, titel: 'Dank je', alineas: [`${naam} ziet nu dat je nummer werkt.`], verder: VERDER }
    case 'onbekend':
      return {
        ...LEEG,
        titel: 'Deze link werkt niet',
        alineas: ['Open de hele link uit het bericht nog eens, of vraag om een nieuwe.'],
        verder: VERDER,
      }
    case 'verlopen':
      return {
        ...LEEG,
        titel: 'Deze link werkt niet meer',
        alineas: ['Een uitnodiging is 7 dagen geldig. Vraag wie je uitnodigde om een nieuwe.'],
        verder: VERDER,
      }
    case 'nog_niet_gecontroleerd':
      return {
        ...LEEG,
        titel: 'Je nummer is nog niet gecontroleerd',
        alineas: ['Tik op de knop, dan sturen we je één sms om je nummer te controleren.'],
        knoppen: [knop('stuur_sms', 'Stuur de sms')],
      }
    case 'beantwoord':
      return {
        ...LEEG,
        titel: 'Je hebt deze uitnodiging al beantwoord',
        alineas: ['Kwam er daarna een sms van Tot Thuis om je nummer te controleren, tik dan op de link in die sms.'],
        verder: VERDER,
      }
    case 'storing':
      return { ...LEEG, titel: 'Dat lukte niet', alineas: ['Probeer het zo nog eens.'], knoppen: [knop('opnieuw', 'Opnieuw')] }
  }
  return { ...LEEG, titel: 'Dat lukte niet' }
}

/**
 * Na de ja, of na "Stuur de sms": wat er met de controle-sms gebeurt. Niets
 * beloven wat niet vanzelf komt; bij morgen opent zij dezelfde link opnieuw,
 * en dan staat de knop er.
 */
function naDeJa(sms, naam) {
  if (sms === 'wordt_gestuurd') {
    return [
      `We sturen je nu één sms. Tik op de link daarin en dan op de knop, zodat ${naam} ziet dat je nummer werkt.`,
      'De app is nog niet te downloaden; deze pagina werkt ook zonder app.',
    ]
  }
  if (sms === 'morgen') return ['Vandaag kunnen we je geen sms meer sturen om je nummer te controleren. Open deze link morgen nog eens, dan kan het wel.']
  return ['Een sms om je nummer te controleren is niet nodig: je hebt de app van Tot Thuis al.']
}
