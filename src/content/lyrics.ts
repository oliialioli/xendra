/**
 * The words of each song on the album, as the band gave them, keyed by the
 * song's slug (see songSlug in lyricsPaths.ts). Each inner list is a stanza,
 * one string per line. A line in brackets is a note, not sung: "(x2)" at a
 * line's end repeats it, "(musikala)" marks an instrumental passage.
 */
export const LYRICS: Record<string, string[][]> = {
  'amilena': [
    ['Egiten duela dioenak', 'Egiten duenaz dioena', 'Haize boladetaz zioena', 'Zen airea dena'],
  ],
  'belar-txarrak': [
    ['Praka zatarrak harrak janda, armada', 'Kanta zaharrak marmarka', 'Narrats arrastaka, arrakastaz', 'altxa da baldar bat'],
    ['Hemen mesede lehen ez zen', 'Ezeren, menpe zen ezerrez', 'Besteen eskeen, betetzez', 'Eskertzen zen berez'],
    ['Erre da dena berez'],
    ['Erre belar txarrak bare,', 'bestea ez (x2)'],
    ['Belarra erre,', 'eta beste ezer', 'ez da erre'],
    ['Erre belar txarrak bare,', 'bestea ez (x2)'],
    ['Belarra errez,', 'eta ezer ez', 'erre da berez,', 'erre da berez.'],
  ],
  'lurrazala': [
    ['Bere lekua atzean utziz datorrenari', 'Noraezean toki hobeen beilari', 'Etorri nahi ez ta behartuta datozenei', 'Lur hauetara iristen uzten ez zaionari', 'Gure herrian bizitza egin nahi duenari', 'Deserri hontan arrotz sentitzen zaizkigunei', 'Hona heldu eta baztertuta dauzkagunei', 'Esan nahiko nizkieke bi hitz'],
    ['Zuen egunen bezpera dugu gure herrian', 'Zuen egunen bezpera dugu zuen herrian'],
    ['Haiei lekuan aurrera egiten dabiltzanei', 'Handik ihesi etorri diren guzti horiei', 'Hona bidean amets bat bete duten guztiei', 'Ta behin helduta amets gaizto bat bizi dutenei', 'Hona bidean bizitza galdu duten denei', 'Sorterria goizero oroitzen duen haiei', 'Entzun nahiko nizkieke bi hitz'],
    ['Gure egunen bezpera dugu gure herrian', 'Gure egunen bezpera dugu zuen herrian'],
    ['Zuen egunen bezpera dugu gure herrian', 'Zuen egunen bezpera dugu…'],
    ['Lurrazalean eta larruazalean', 'Bereizi artean bizitzen balioa'],
  ],
  'hor': [
    ['Egunero agurtzen du egunsentiak', 'Ordurako lanean hasita garaiz', 'Postontziak gosaltzen du egunkaria', 'Ate atzean belarri bat dauka zai'],
    ['Kanpandorre azpian du bere kabia', 'Jende arruntaren elkargune lasai', 'Egunerokotasunaren begirale', 'Gorputz biluziek kristal zikina etsai'],
    ['Hor zegoen semaforoa baino lehen', 'Iratiko trenaren bide izandakoaren', 'Errail gainean jarrita'],
    ['(musikala)'],
    ['Egunero agurtzen du egunsentia', 'Zuri egingo dizun agur berberaz', 'Kioskoa bulego duen dantzaria', 'Klaketa propioan bere erritmoaz'],
    ['Bi metro karratuko unibertso batek', 'Sortu dezakeen konplizitateaz', 'Egunkaria besapean doanak uzten du', 'Bizarrak gordetako irribarrea'],
    ['Hor zegoen semaforoa baino lehen', 'Iratiko trenaren bide izandakoaren', 'Errail gainean jarrita (x2)'],
    ['Hor hor… (x2)'],
  ],
  'errauts-eskuak': [
    ['Gerta zitekeen', 'Eta bazenekien', 'Aukera bat bazela', 'Baina zu begira beste aldera', 'Gerta zitekeen'],
    ['Eta erre zitzaigun', 'Gorputz bat bere onenean', 'Baso oso baten berdea', 'Ilusioaren bidean', 'Guri erre zitzaigun'],
    ['Piztua den sua', 'Ezin da itzali'],
    ['Piztua den sua', 'Itzaliko duenik'],
    ['Errautsa eskuetan', 'Oraindik pausatu gabe', 'Genuenetik erre da', 'Ez genuenetik ere', 'Errauts eskuetan'],
    ['Ingurura begira', 'Kea begietan sartzean', 'Galera ulertu nahiean', 'Galdera bat ezpain ertzean', 'Nola heldu naiz honaino?'],
    ['Galera bakoitza berunez', 'Azalean daramagunez', 'Galtzearen galtzeaz galduz', 'Galtzeko beldurra umorez', 'Belaunaldi honen egunez', 'Poesiarik ez dugunez', 'Ilunabarren maiztasunez', 'Bizitzak su hartzen digunez'],
  ],
  'erregai': [
    ['Ohhhh'],
    ['Zalantza daukazu maiz', 'Norentzako den garaiz', 'Nor daukazun alboan', 'Eta nor ez daukazun zain'],
    ['Kateatu dituzun une guztien erregai', 'Izan direnei zor diezun esker onaz gain', 'Bakoitzak bere bidetik egin du aurrera maiz.'],
    ['Minez ohartu zara maiz', 'Berandu baina garaiz', 'Nork hartu zaituen laguntzat', 'Nork bihurtu etsai'],
    ['Norberak bere akatsak', 'Barkatzeko bezain gai,', 'Bagenu besteenak ulertzeko aina errai', 'Aukeran bizi hobe bat genuke aurretik zain'],
  ],
  'hura': [
    ['Tantaka tantaka kantaka kantaka'],
    ['Ura da tantaka bizitza kantaka'],
    ['Egonean egonean aurkitzen zaitudanean', 'Hitz jarioa nabari dizut zure baitarako ura geldi dago'],
    ['Ezin egon egon ezin berotzean geldi ezin'],
    ['Gozatua zaitut lurrunean egarria ase ezin'],
    ['Mugitu ezinean utzi zaitzaken beldurra arazo', 'Bidea hautatuz beti itzaletan zure kalterako'],
    ['Ohhh'],
    ['Moldatzen zara ahal bezala mundura ura', 'Izotza lurruna izan zaitezken modura'],
    ['Izan zaitezken modura lurruna izotza ura', 'Moldatzen zara ahal bezala mundura'],
  ],
  'bakoitzari-berea': [
    ['Beharrezkotzat duguna sortzen', 'Behar duguna ari da suntsitzen', 'Sostengatu ezin dena desiratzen', 'Desiratu daitekeena mugatzen', 'Ez al da erosotasunaren', 'Ondorietan erreparatzen', 'Soberan duguna askoren gosearen', 'Sorburu ez balitz bezala jokatzen'],
    ['Bakoitzari denona denetik iristen zaio berea', 'Batzuek denona denetik gehiegi hartu dute ordea', 'Bakoitzak behar duenetik jaso dezan bere alea', 'Gehiegi hartu dutenei kendu beharko zaie gurea'],
    ['Dena aldatzeko asmo baten', 'Lehen pausoetan engaiatzen', 'Ageri diren adaxkak baso baten', 'Zantzu besterik ez direla ulertzen', 'Gauzak egiteko modu baten', 'Eraginkortasunean ontzen', 'Konpromezu hitzari zentzua hartzen', 'Ahal denean behar dena ematen'],
    ['Bakoitzari denona denetik iristen zaio berea', 'Batzuek denona denetik gehiegi hartu dute ordea', 'Bakoitzak behar duenetik jaso dezan bere alea', 'Gehiegi hartu dutenei kendu beharko zaie gurea'],
  ],
};
