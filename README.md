# Tot Thuis: de website

De website van Tot Thuis, op https://totthuis.nl.

- `index.html` is de voorpagina: wat Tot Thuis is, wat een sms van TotThuis
  betekent, en wie erachter zit.
- `privacy.html` (op /privacy) zegt welke gegevens de app in de testfase
  verwerkt, waar ze staan en hoe lang.
- `beeld/` zijn twee schermen uit de app, gemaakt van de echte
  schermcomponenten met voorbeeldnamen.
- `t.html` is de pagina achter de testlink (§5.7): wie als vertrouwenspersoon
  een test krijgt, tikt hier op "Het is aangekomen". Er is geen app voor nodig.
  De link in de sms is `https://totthuis.nl/t#<token>`.

Drie regels voor de testpagina:

- Het token staat in de link achter een `#`. Een browser stuurt dat deel nooit
  naar deze host; alleen de knop stuurt het, naar de functie van Tot Thuis.
- Bij het openen gaat er niets de deur uit. Pas de knop registreert.
- Er staat geen sleutel in deze repo. Het adres van de functie is openbaar.

De letters (IBM Plex Sans, onder de SIL Open Font License, zie
`fonts/OFL.txt`) staan in deze repo: de site laadt niets van een andere partij.

De bron staat in de (privé) repo van de app, onder `web/`. Deze repo is alleen
de publicatie op GitHub Pages; wijzig de pagina daar, niet hier.
