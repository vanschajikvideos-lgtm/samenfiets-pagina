# samenfiets-pagina

De pagina achter de testlink van SamenFiets (§5.7): wie als vertrouwenspersoon
een test krijgt, tikt hier op "Het is aangekomen". Er is geen app voor nodig.

- Het token staat in de link achter een `#`. Een browser stuurt dat deel nooit
  naar deze host; alleen de knop stuurt het, naar de functie van SamenFiets.
- Bij het openen gaat er niets de deur uit. Pas de knop registreert.
- Er staat geen sleutel in deze repo. Het adres van de functie is openbaar.

De pagina staat op https://totthuis.nl/t (`t.html`); de link in de sms is
`https://totthuis.nl/t#<token>`.

De bron staat in de (privé) SamenFiets-repo onder `web/` (`t.html` en
`test/`). Deze repo is alleen de publicatie op GitHub Pages; wijzig de pagina
daar, niet hier.
