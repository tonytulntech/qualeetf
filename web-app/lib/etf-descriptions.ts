/**
 * Descrizioni "a prova di stupido" per ogni ETF.
 * La funzione getEtfDescription() genera automaticamente una spiegazione
 * plain-Italian basata su underlyingIndex, category e subCategory.
 */

import type { ETFEntry } from './etf-catalog'

// ─── Overrides specifici per indice ──────────────────────────────────────────
// Quando l'underlyingIndex è riconoscibile, usiamo la descrizione più precisa.

const INDEX_DESCRIPTIONS: { match: RegExp; desc: string }[] = [
  // ── Azionari Globali ──────────────────────────────────────────────────────
  {
    match: /msci world$/i,
    desc: 'Replica le ~1.500 aziende più grandi dei paesi sviluppati: USA (~70%), Europa (~15%), Giappone (~6%) e altri. ⚠️ Non include i mercati emergenti (Cina, India, Brasile). È il punto di partenza di quasi ogni portafoglio diversificato.',
  },
  {
    match: /ftse all-?world/i,
    desc: 'Come un MSCI World ma include anche le aziende dei mercati emergenti (Cina, India, Taiwan, Brasile...). Con un solo ETF copri quasi l\'intero mercato azionario mondiale: ~4.000 aziende in 50 paesi.',
  },
  {
    match: /msci acwi/i,
    desc: 'L\'indice più completo in assoluto: ~2.900 aziende sia dai paesi sviluppati che emergenti. Simile al FTSE All-World ma con criteri di selezione leggermente diversi. Copre circa il 85% del mercato azionario mondiale.',
  },
  {
    match: /msci world imi/i,
    desc: 'Come l\'MSCI World ma aggiunge anche le aziende piccole (small cap). Copre circa il 99% del mercato azionario dei paesi sviluppati — più completo dell\'MSCI standard che esclude le piccole aziende.',
  },

  // ── USA ───────────────────────────────────────────────────────────────────
  {
    match: /s&p\s*500/i,
    desc: 'Le 500 più grandi aziende americane: Apple, Microsoft, Amazon, Nvidia, Google... Pesate per capitalizzazione — chi vale di più pesa di più. È il benchmark più replicato al mondo e rappresenta da solo circa il 60% del mercato azionario globale.',
  },
  {
    match: /nasdaq.?100/i,
    desc: 'Le 100 aziende più grandi del Nasdaq, quasi tutte tech e growth: Apple, Microsoft, Nvidia, Amazon, Google... Alta concentrazione su tecnologia (~57%). Rendimenti storici stellari ma crolli altrettanto violenti (-30% o più nelle correzioni).',
  },
  {
    match: /nasdaq composite/i,
    desc: 'Tutte le ~3.000 aziende quotate al Nasdaq, l\'exchange americano per eccellenza del settore tecnologico. Più diversificato del Nasdaq 100 ma comunque orientato pesantemente su tech e biotech.',
  },
  {
    match: /russell\s*2000/i,
    desc: 'Le 2.000 aziende americane di piccola dimensione (small cap). Più rischiose dei big ma con potenziale di crescita maggiore. Si muovono più dell\'S&P 500 nelle fasi di mercato — amplificate sia i guadagni che le perdite.',
  },
  {
    match: /dow jones industrial/i,
    desc: 'Le 30 "blue chip" americane più iconiche: Coca-Cola, Boeing, Disney, Goldman Sachs... L\'indice americano più famoso storicamente, ma non pesato per capitalizzazione — è poco rappresentativo del mercato reale.',
  },
  {
    match: /msci usa/i,
    desc: 'Le maggiori aziende americane secondo la metodologia MSCI. Simile all\'S&P 500 ma con criteri di inclusione diversi — copre circa il 85% della capitalizzazione di borsa degli USA.',
  },

  // ── Europa ────────────────────────────────────────────────────────────────
  {
    match: /stoxx\s*europe\s*600/i,
    desc: 'Le 600 maggiori aziende europee in 17 paesi: UK, Svizzera, Germania, Francia, Italia... Il benchmark di riferimento per il mercato azionario europeo. Include anche paesi fuori dall\'eurozona (UK, Svizzera, Svezia).',
  },
  {
    match: /euro\s*stoxx\s*50/i,
    desc: 'Solo le 50 aziende più grandi della zona euro: LVMH, TotalEnergies, SAP, Siemens, Inditex... Esclude UK e Svizzera. Molto concentrato — le prime 10 aziende pesano quasi il 50% dell\'indice.',
  },
  {
    match: /msci europe/i,
    desc: 'Le maggiori aziende europee secondo la metodologia MSCI: include UK, Svizzera, paesi nordici oltre all\'eurozona. Diversificato su circa 430 aziende in 15 paesi sviluppati europei.',
  },
  {
    match: /ftse\s*100/i,
    desc: 'Le 100 maggiori aziende britanniche quotate alla Borsa di Londra: Shell, HSBC, AstraZeneca, BP... Settorialmente orientato su energia, banche e farmaceutica. Espresso in sterline.',
  },
  {
    match: /dax/i,
    desc: 'Le 40 maggiori aziende tedesche: Volkswagen, SAP, Allianz, Bayer, Siemens... La Germania è la principale economia manifatturiera europea. Espresso in euro.',
  },

  // ── Mercati Emergenti ─────────────────────────────────────────────────────
  {
    match: /msci emerging markets/i,
    desc: 'Le maggiori aziende di Cina, India, Taiwan, Corea del Sud, Brasile e altri paesi in sviluppo. Potenziale di crescita maggiore rispetto ai paesi sviluppati, ma anche più volatile e soggetto a rischi politici e valutari.',
  },
  {
    match: /ftse emerging/i,
    desc: 'Simile all\'MSCI Emerging Markets ma segue la metodologia Vanguard/FTSE. Include circa 2.300 aziende emergenti in oltre 25 paesi. Nota: Corea del Sud è classificata "sviluppata" da FTSE ma "emergente" da MSCI.',
  },
  {
    match: /msci china/i,
    desc: 'Solo aziende cinesi: giganti tech come Alibaba, Tencent, Meituan, ma anche banche e industrie statali. Alta volatilità e rischi regolatori significativi — il governo cinese può cambiare le regole del gioco da un giorno all\'altro.',
  },
  {
    match: /msci india/i,
    desc: 'Le maggiori aziende indiane: Reliance, TCS, Infosys, HDFC... L\'India è la democrazia più popolosa al mondo e una delle economie a crescita più rapida. Alto potenziale ma anche alta valutazione (P/E elevato).',
  },

  // ── Asia ─────────────────────────────────────────────────────────────────
  {
    match: /msci asia/i,
    desc: 'Copre i mercati azionari di Asia e Pacifico: Giappone, Cina, Corea del Sud, Australia, Taiwan, India... Ottima diversificazione geografica fuori dall\'Occidente, con esposizione alle economie a più rapida crescita.',
  },
  {
    match: /msci japan/i,
    desc: 'Le maggiori aziende giapponesi: Toyota, Sony, SoftBank, Nintendo, Honda... Il Giappone è la terza economia mondiale ma la borsa ha impiegato 30 anni a tornare ai massimi del 1989. Attenzione al rischio yen.',
  },
  {
    match: /msci pacific/i,
    desc: 'Paesi del Pacifico sviluppati: Giappone (circa 60%), Australia, Hong Kong, Singapore, Nuova Zelanda. Nessuna esposizione a USA ed Europa — utile per diversificare geograficamente.',
  },

  // ── Factor / Smart Beta ───────────────────────────────────────────────────
  {
    match: /momentum/i,
    desc: 'Seleziona le azioni che sono salite di più negli ultimi 6-12 mesi — la teoria è che i vincitori tendono a continuare a vincere. Funziona bene nei trend prolungati, ma nei cambi bruschi di mercato può perdere molto rapidamente.',
  },
  {
    match: /quality|qualit/i,
    desc: 'Seleziona aziende con bilanci solidi: alta redditività, basso debito, utili stabili nel tempo. È il "dormi tranquillo": storicamente perde meno nelle crisi mantenendo rendimenti decenti nel lungo periodo.',
  },
  {
    match: /value|valu/i,
    desc: 'Seleziona aziende che il mercato considera "economiche" rispetto ai fondamentali (P/E basso, P/Book basso). Strategia contrarian: compra ciò che gli altri ignorano. Può sottoperformare per anni prima di tornare.',
  },
  {
    match: /minimum.?vol|min.?vol|low.?vol/i,
    desc: 'Seleziona le azioni meno volatili dell\'indice. Nelle crisi scende meno, ma nei rally sale meno. Per chi vuole stare investito in azioni senza dormire male nelle correzioni.',
  },
  {
    match: /equal.?weight/i,
    desc: 'A differenza degli ETF classici, ogni azienda ha lo stesso peso — che sia Apple o una piccola società. Più esposizione alle aziende medie e piccole. Più "diversificato" in senso puro, ma storicamente non sempre superiore al cap-weighted.',
  },
  {
    match: /multi.?factor/i,
    desc: 'Combina più strategie "smart beta" insieme: value, quality, momentum, low volatility. L\'idea è di non dipendere da un solo fattore che può attraversare periodi negativi. Più complesso ma potenzialmente più stabile.',
  },

  // ── Dividendi ────────────────────────────────────────────────────────────
  {
    match: /dividend|dividendo|high div|divi/i,
    desc: 'Seleziona aziende che pagano dividendi elevati e regolari. Genera un flusso di reddito costante nel tempo. ⚠️ Un dividendo alto può indicare un\'azienda matura senza crescita — non è automaticamente "migliore" di un ETF senza dividendi.',
  },

  // ── ESG / SRI ─────────────────────────────────────────────────────────────
  {
    match: /sri|esg|sustainable|socially responsible/i,
    desc: 'Simile all\'indice base ma esclude aziende controverse: armi, tabacco, carbone, violazioni dei diritti umani... I rendimenti a lungo termine sono simili agli ETF tradizionali. Per chi vuole investire in linea con i propri valori.',
  },

  // ── Settoriali ────────────────────────────────────────────────────────────
  {
    match: /information technology|it sector|tech/i,
    desc: 'Solo aziende tecnologiche: hardware, software, semiconduttori, cloud computing. Il settore che ha guidato i mercati nell\'ultimo decennio. Alta concentrazione (le prime 5 pesano spesso il 40%+) e volatilità elevata.',
  },
  {
    match: /health.?care|healthcare|pharma/i,
    desc: 'Farmaceutica, biotech, ospedali, dispositivi medici. È un settore "difensivo": la gente si ammala indipendentemente dalla congiuntura economica. Meno volatile dell\'azionario generico, ottimo per periodi di incertezza.',
  },
  {
    match: /clean energy|renewable|green energy|solar|wind/i,
    desc: 'Energie rinnovabili: solare, eolico, idrogeno, batterie... Settore molto volatile e fortemente influenzato dalla politica energetica dei governi. Alto potenziale ma anche rischi elevati — non adatto come nucleo del portafoglio.',
  },
  {
    match: /energy sector|oil|petroleum/i,
    desc: 'Petrolio, gas naturale e aziende energetiche tradizionali. Il rendimento dipende strettamente dal prezzo del petrolio. Buon hedge contro l\'inflazione ma settore in transizione strutturale.',
  },
  {
    match: /financials|banking|financial sector/i,
    desc: 'Banche, assicurazioni, asset manager. È il settore più ciclico in assoluto: cresce molto nelle fasi di espansione, crolla nelle recessioni e crisi finanziarie. Sensibile ai tassi d\'interesse.',
  },
  {
    match: /consumer staples|consumer defensive/i,
    desc: 'Aziende che vendono beni di prima necessità: cibo, bevande, prodotti per la casa (Nestlé, P&G, Unilever, Coca-Cola...). Settore difensivo: la gente compra dentifricio anche in recessione.',
  },
  {
    match: /consumer discretionary|consumer cyclical/i,
    desc: 'Beni e servizi non essenziali: auto, moda, ristoranti, viaggi, Amazon... Molto ciclico — se l\'economia va bene le persone spendono di più; in recessione tagliano questi acquisti per primi.',
  },
  {
    match: /industrial/i,
    desc: 'Aziende manifatturiere, infrastrutture, trasporti, difesa. Settore ciclico legato alla crescita economica globale. Beneficia dei cicli espansivi ma soffre nelle recessioni.',
  },
  {
    match: /material/i,
    desc: 'Materie prime "lavorate": acciaio, alluminio, chimica, fertilizzanti, carta... Ciclico come l\'industriale ma con una componente commodity. Buon hedge contro l\'inflazione.',
  },
  {
    match: /telecom|communication/i,
    desc: 'Telecomunicazioni e media: TIM, Vodafone, Netflix, Meta, Alphabet... Mix tra aziende tradizionali (operatori telecom, dividendi stabili) e tech puro (FAANG). Settore in trasformazione.',
  },
  {
    match: /utilities/i,
    desc: 'Acqua, elettricità, gas: aziende che gestiscono infrastrutture essenziali. Rendimento stabile e dividendi costanti. Settore difensivo ma sensibile all\'aumento dei tassi d\'interesse (concorrono con le obbligazioni).',
  },
  {
    match: /real estate|reit/i,
    desc: 'Fondi immobiliari quotati (REIT): uffici, centri commerciali, magazzini, appartamenti, ospedali... Generano reddito da affitti distribuito come dividendo. Sensibili ai tassi d\'interesse e al ciclo immobiliare.',
  },

  // ── Obbligazionari ────────────────────────────────────────────────────────
  {
    match: /aggregate|agg bond/i,
    desc: 'Un mix di titoli di stato e obbligazioni corporate investment grade di tutto il mondo. È l\'"S&P 500 delle obbligazioni" — diversificato e stabile. Non rende molto, ma bilancia il rischio dell\'azionario in portafoglio.',
  },
  {
    match: /govt|government|treasury|bund|btp/i,
    desc: 'Presta soldi ai governi (USA, Germania, Italia...) in cambio di un interesse fisso. Molto stabile: i governi raramente falliscono. Utile come "àncora" del portafoglio nelle crisi azionarie. Il rendimento dipende dai tassi della banca centrale.',
  },
  {
    match: /corporate.*investment|investment.*grade/i,
    desc: 'Presta soldi alle grandi aziende con i bilanci più solidi (rating BBB o superiore). Più rischioso dei titoli di stato ma rende un po\' di più. Un buon compromesso tra sicurezza e rendimento.',
  },
  {
    match: /high.?yield|junk|hight yield/i,
    desc: 'Presta soldi ad aziende rischiose in cambio di rendimenti più alti. Chiamati anche "junk bond". Rischio di default elevato — in caso di recessione queste aziende possono non rimborsare il debito. Per investitori con stomaco forte.',
  },
  {
    match: /inflation.?link|tips|linker/i,
    desc: 'Obbligazioni il cui valore e cedole aumentano con l\'inflazione. Proteggono il potere d\'acquisto quando i prezzi salgono. Essenziali nei periodi inflazionistici come copertura del portafoglio.',
  },
  {
    match: /emerging.*bond|em.*bond|bond.*emerging/i,
    desc: 'Obbligazioni emesse da governi e aziende dei mercati emergenti (Cina, Brasile, India...). Rendimenti più alti di quelli occidentali ma con rischio maggiore: svalutazioni valutarie, instabilità politica, default.',
  },
  {
    match: /short.?term|short term|ultra short|money market/i,
    desc: 'Obbligazioni a breve scadenza (meno di 3 anni) o strumenti monetari. Molto poco volatile — si muove pochissimo. Utile come "parcheggio" temporaneo per liquidità con un rendimento leggermente superiore al conto corrente.',
  },

  // ── Materie Prime ─────────────────────────────────────────────────────────
  {
    match: /gold|oro$/i,
    desc: 'Investe in oro fisico (o contratti futures sull\'oro). L\'oro non produce reddito ma è storicamente il "porto sicuro" per eccellenza: sale nelle crisi, protegge dall\'inflazione e dalla perdita di valore delle valute.',
  },
  {
    match: /silver|argento/i,
    desc: 'Argento fisico o futures. Più volatile dell\'oro e ha anche un utilizzo industriale (pannelli solari, elettronica). Segue in parte l\'oro ma con oscillazioni molto più ampie.',
  },
  {
    match: /commodit|materie prime/i,
    desc: 'Un paniere di materie prime: petrolio, gas, metalli, prodotti agricoli. Ottima protezione contro l\'inflazione quando i prezzi delle materie prime salgono. Alta volatilità e costo di gestione più elevato degli ETF azionari.',
  },
  {
    match: /industrial metal|copper|rame/i,
    desc: 'Metalli industriali: rame, alluminio, zinco, nichel... Materie prime essenziali per infrastrutture e transizione energetica. Molto ciclici: salgono quando l\'economia globale cresce, crollano nelle recessioni.',
  },
  // ── USD Treasury ─────────────────────────────────────────────────────────
  {
    match: /bloomberg us treasury 20\+|us treasury 20\+/i,
    desc: 'Titoli di stato americani con scadenza oltre 20 anni. Massima sensibilità ai tassi d\'interesse: quando i tassi scendono guadagna molto, quando salgono perde molto. Equivalente europeo del TLT americano. Solo per chi tollera alta volatilità obbligazionaria.',
  },
  {
    match: /bloomberg us treasury 7.?10|us treasury 7.?10/i,
    desc: 'Titoli di stato americani con scadenza 7-10 anni. Buon equilibrio tra sensibilità ai tassi e rendimento. Diversifica il portafoglio dal rischio europeo — il dollaro e l\'euro non si muovono sempre insieme.',
  },
  {
    match: /bloomberg us treasury 3.?7|us treasury 3.?7/i,
    desc: 'Titoli di stato americani a medio termine (3-7 anni). Meno sensibile ai tassi rispetto alle scadenze lunghe. Buon compromesso per chi vuole esposizione al Treasury USA senza troppa volatilità.',
  },
  {
    match: /bloomberg us treasury 0.?1|us treasury 0.?1/i,
    desc: 'Titoli di stato americani a brevissimo termine (sotto 1 anno). Praticamente stabile come liquidità ma con un rendimento leggermente superiore. Utile come parcheggio in dollari quasi senza rischio.',
  },
  {
    match: /bloomberg us treasury float|vanguard usd treasury/i,
    desc: 'Titoli di stato americani su tutte le scadenze. Presta soldi al governo USA — il debitore più sicuro al mondo. Ottima diversificazione valutaria (dollaro) rispetto alle obbligazioni europee.',
  },
  // ── USD Corporate ─────────────────────────────────────────────────────────
  {
    match: /bloomberg us corporate|us corporate float/i,
    desc: 'Obbligazioni delle maggiori aziende americane (investment grade). Rese superiori ai Treasury USA ma con un minimo di rischio in più. In dollari — attenzione al rischio cambio se non sei coperto.',
  },
  // ── EM Bond ───────────────────────────────────────────────────────────────
  {
    match: /jpmorgan embi|embi global/i,
    desc: 'Il benchmark di riferimento per le obbligazioni dei mercati emergenti denominate in dollari. Governi di Brasile, Messico, Indonesia, Arabia Saudita... Rendimenti più alti dell\'Occidente ma con rischi politici e valutari. Non per il nucleo del portafoglio.',
  },
  {
    match: /bloomberg usd em government/i,
    desc: 'Debito governativo dei paesi emergenti in dollari. Più di 50 paesi inclusi — alta diversificazione geografica. Cedole elevate rispetto ai titoli di stato occidentali, ma il rischio di svalutazione è reale.',
  },
  {
    match: /jpmorgan gbi.?em/i,
    desc: 'Obbligazioni governative emergenti in valuta locale (non in dollari). Massima esposizione ai paesi in sviluppo: rendimenti potenzialmente alti ma con rischio valutario significativo — il reale brasiliano o la rupia indiana fluttuano molto.',
  },
  // ── Green Bond ────────────────────────────────────────────────────────────
  {
    match: /bloomberg msci global green bond|msci global green/i,
    desc: 'Obbligazioni "verdi" emesse da governi e aziende per finanziare progetti ambientali: energia rinnovabile, efficienza energetica, trasporti puliti... Simile al global aggregate standard per rischio/rendimento, ma con impatto ESG certificato.',
  },
  {
    match: /bloomberg sasb euro corporate esg/i,
    desc: 'Obbligazioni corporate europee selezionate con criteri ESG: esclude aziende controverse e premia quelle con pratiche sostenibili. Simile al corporate europeo tradizionale ma con filtro di sostenibilità.',
  },
  // ── Overnight / Ultra-Short ───────────────────────────────────────────────
  {
    match: /eonia overnight|bundesbank eonia/i,
    desc: 'Replica il tasso overnight europeo (EONIA/€STR): il tasso a cui le banche si prestano denaro da un giorno all\'altro. Praticamente non volatile — cresce ogni giorno di un piccolo importo. Il "conto di liquidità" del mercato finanziario.',
  },
  {
    match: /€str overnight|overnight return/i,
    desc: 'Segue il tasso €STR, il tasso overnight ufficiale della BCE. Zero rischio di mercato — sale ogni giorno di pochissimo. Utile per parcheggiare liquidità a breve termine guadagnando il tasso della banca centrale.',
  },
  {
    match: /bloomberg euro government 1.?3 year/i,
    desc: 'Titoli di stato dell\'Eurozona con scadenza 1-3 anni. Molto poco volatile — quasi come liquidità ma con rendimento leggermente superiore. Rischio quasi nullo grazie alle scadenze breve e alla solidità dei governi europei.',
  },
  // ── Crypto ───────────────────────────────────────────────────────────────
  {
    match: /spot bitcoin|physical bitcoin/i,
    desc: 'Esposizione diretta al Bitcoin — la prima e più grande criptovaluta. Asset altamente speculativo: oscillazioni del 50-80% in un anno sono normali. Non produce reddito. Ha corso del +150% nel 2023 ma -65% nel 2022. Solo come piccola scommessa in portafoglio.',
  },
  {
    match: /spot ethereum/i,
    desc: 'Ethereum è la piattaforma blockchain più usata per app decentralizzate, DeFi e NFT. Il token ETH è il "carburante" di questa rete. Più volatile del Bitcoin, con un profilo rischio/rendimento ancora più estremo. Solo per chi accetta grandi oscillazioni.',
  },
  {
    match: /spot bnb|spot binance/i,
    desc: 'BNB è il token nativo di Binance, il più grande exchange crypto al mondo. Il suo valore è legato alle fortune di Binance. Alta volatilità come tutte le altcoin, con rischi regolatori aggiuntivi legati al settore degli exchange.',
  },
  {
    match: /spot solana/i,
    desc: 'Solana è una blockchain ad alte prestazioni (molto veloce ed economica). SOL è il suo token nativo. Uno dei competitor più seri di Ethereum ma con storia più breve e rischi tecnici ancora da valutare.',
  },
  {
    match: /spot xrp/i,
    desc: 'XRP è il token di Ripple, pensato per i pagamenti internazionali tra banche. Ha avuto lunghe battaglie legali con la SEC americana. Controverso nel mondo crypto — alcuni lo considerano quasi una "crypto centralizzata".',
  },
  {
    match: /spot cardano/i,
    desc: 'Cardano (ADA) è una blockchain accademica costruita con approccio scientifico e peer-reviewed. Sviluppo lento ma solido. Molto popolare tra chi preferisce fondamenta tecniche solide, ma con adozione reale ancora limitata.',
  },
  {
    match: /spot avalanche/i,
    desc: 'Avalanche è una piattaforma blockchain veloce e scalabile, con architettura innovativa a subnet. AVAX è il suo token. Competitore di Ethereum nel settore DeFi e applicazioni decentralizzate. Alta volatilità tipica delle altcoin.',
  },
  {
    match: /spot dogecoin/i,
    desc: 'Nato come meme nel 2013, Dogecoin è diventato una delle crypto più note grazie a Elon Musk. Non ha utilità tecnica specifica ma ha una community enorme. Puramente speculativo — il suo prezzo si muove su tweet e notizie.',
  },
  {
    match: /spot chainlink/i,
    desc: 'Chainlink è il principale "oracolo" blockchain: porta dati del mondo reale (prezzi, meteo, sport...) dentro gli smart contract. Infrastruttura critica dell\'ecosistema DeFi. Meno speculativo dei meme coin ma comunque ad alta volatilità.',
  },
  {
    match: /spot polkadot/i,
    desc: 'Polkadot collega blockchain diverse tra loro ("interoperabilità"). DOT permette di costruire parachain personalizzate. Progetto ambizioso tecnicamente ma con forti competitor. Alta volatilità e forte dipendenza dall\'adozione dell\'ecosistema.',
  },
  {
    match: /spot polygon/i,
    desc: 'Polygon (ex MATIC) è un layer-2 di Ethereum: rende le transazioni sulla rete Ethereum più veloci ed economiche. Molto usato in NFT e gaming. Il token MATIC/POL è tra le altcoin più rilevanti per utilizzo reale.',
  },
  {
    match: /spot uniswap/i,
    desc: 'Uniswap è il principale exchange decentralizzato (DEX) su Ethereum. UNI è il suo token di governance. Il trading decentralizzato è uno dei casi d\'uso crypto più solidi, ma la concorrenza tra DEX è feroce.',
  },
  {
    match: /spot litecoin/i,
    desc: 'Litecoin (LTC) è uno dei "dinosauri" delle crypto — nato nel 2011 come versione più leggera del Bitcoin. Transazioni più veloci e economiche di BTC. Scarsa innovazione negli ultimi anni ma ancora liquido e scambiato.',
  },
  {
    match: /spot near/i,
    desc: 'NEAR Protocol è una blockchain veloce e developer-friendly, pensata per applicazioni Web3. Architettura sharding innovativa. Ancora in fase di crescita dell\'ecosistema — alto potenziale ma anche alta incertezza.',
  },
  {
    match: /bitcoin|crypto|blockchain/i,
    desc: 'Esposizione al Bitcoin o alle criptovalute tramite un prodotto regolamentato. Asset altamente speculativo: oscillazioni del 50-80% in un anno sono normali. Solo per chi ha una propensione al rischio molto alta e considera questa una piccola parte del portafoglio.',
  },

  // ── Multi-Asset ───────────────────────────────────────────────────────────
  {
    match: /lifestrategy|life strategy|multi.?asset|balanced|bilanciato/i,
    desc: 'Un portafoglio pronto all\'uso: combina automaticamente azioni e obbligazioni in proporzione fissa (es. 60/40 o 80/20). Ideale per chi vuole stare investito senza gestire più ETF. Il ribilanciamento automatico è incluso.',
  },
]

// ─── Fallback per categoria + subCategoria ─────────────────────────────────

const CAT_SUB_DESCRIPTIONS: Partial<Record<string, Partial<Record<string, string>>>> = {
  Azionari: {
    Globale:
      'Investe nelle maggiori aziende di più paesi del mondo. Ottima diversificazione geografica con un solo strumento. La composizione esatta dipende dall\'indice replicato — controlla se include o meno i mercati emergenti.',
    USA:
      'Investe nelle principali aziende americane. Gli USA rappresentano circa il 60% del mercato azionario mondiale, quindi questo ETF è fortemente concentrato su un singolo paese (seppur il più importante).',
    Europa:
      'Investe nelle maggiori aziende europee. Storicamente rendimenti inferiori agli USA nell\'ultimo decennio, ma offrono diversificazione e molte aziende sono esposte globalmente pur essendo quotate in Europa.',
    Emergenti:
      'Investe in aziende di paesi in via di sviluppo: Cina, India, Brasile, Taiwan, Corea del Sud... Maggiore potenziale di crescita rispetto ai paesi sviluppati ma anche più volatilità, rischi politici e valutari.',
    Asia:
      'Investe nei mercati azionari asiatici. Giappone, Cina, Corea del Sud, Australia tra i principali. Alta diversificazione geografica al di fuori dell\'Occidente, con economie spesso a crescita più rapida.',
    'Small Cap':
      'Investe in aziende piccole e medie. Più rischiose dei colossi quotati, ma con potenziale di crescita superiore. Utile per aggiungere diversificazione oltre le grandi multinazionali.',
    Tecnologia:
      'Solo aziende tecnologiche: software, hardware, chip, cloud, AI. Settore che ha guidato i mercati negli ultimi 15 anni. Alta concentrazione — le performance dipendono da poche aziende dominanti.',
    Healthcare:
      'Farmaceutica, biotech e dispositivi medici. Settore difensivo — la domanda di salute è costante indipendentemente dal ciclo economico. Meno volatile dell\'azionario puro.',
    Energia:
      'Aziende petrolifere e del gas. Molto dipendente dal prezzo delle materie prime energetiche. Buon hedge contro l\'inflazione ma settore in transizione strutturale verso le rinnovabili.',
    Finanza:
      'Banche, assicurazioni, asset manager. Il più ciclico dei settori: ottimo nelle fasi di crescita, vulnerabile nelle crisi finanziarie. Molto sensibile all\'andamento dei tassi d\'interesse.',
    Immobiliare:
      'Fondi immobiliari (REIT) che possiedono e gestiscono proprietà: uffici, centri commerciali, logistica... Generano reddito da affitti. Sensibili ai tassi d\'interesse come le obbligazioni.',
    Factor:
      'Utilizza criteri di selezione "smart" oltre la semplice capitalizzazione di mercato. Può selezionare le aziende più redditizie, quelle con più slancio (momentum), quelle economiche (value) o quelle meno rischiose.',
    Dividendi:
      'Seleziona aziende che distribuiscono dividendi elevati. Genera reddito ricorrente. Utile per chi ha bisogno di flusso di cassa ma tieni presente che i dividendi non sono "rendimento gratuito" — il prezzo scende quando li distribuisce.',
    ESG:
      'Come il corrispondente ETF tradizionale ma con criteri ESG: esclude aziende controverse (armi, tabacco, carbone...). I rendimenti a lungo termine sono simili, con la soddisfazione di investire responsabilmente.',
    'Multi-Asset':
      'Combina azioni e obbligazioni in un unico ETF con proporzione predefinita. Soluzione "tutto in uno" per chi non vuole gestire un portafoglio multi-prodotto. Il ribilanciamento automatico è incluso.',
    NASDAQ:
      'Replica le principali aziende del Nasdaq, il mercato americano dominato dalla tecnologia. Alta esposizione a growth e tech. Rendimenti stellari nel passato ma volatilità elevata.',
  },
  Obbligazionari: {
    Governativi:
      'Presta soldi ai governi acquistando titoli di stato. Molto sicuro ma con rendimenti bassi. L\'ancora del portafoglio: scende raramente molto ma non cresce quanto le azioni. Utile per ridurre la volatilità complessiva.',
    Corporate:
      'Obbligazioni emesse da grandi aziende con buona solidità finanziaria. Più rischioso dei titoli di stato ma con rendimenti superiori. Un buon bilanciamento tra sicurezza e rendimento per la parte difensiva del portafoglio.',
    'High Yield':
      'Obbligazioni di aziende rischiose con alto potenziale di rendimento. Se l\'economia va bene rendono molto; se va male il rischio di default è reale. Solo per chi ha alta tolleranza al rischio.',
    'Inflation-Linked':
      'Il valore di queste obbligazioni cresce con l\'inflazione — se i prezzi salgono, crescono anche le cedole e il capitale. Protezione essenziale contro l\'inflazione per la parte obbligazionaria del portafoglio.',
    Emergenti:
      'Debito di governi e aziende dei paesi emergenti. Rendimenti più alti del debito occidentale ma con più rischi: instabilità politica, svalutazioni valutarie, default. Per chi vuole diversificare la parte obbligazionaria.',
    Globali:
      'Mix di obbligazioni da tutto il mondo: governi e corporate, sia sviluppati che emergenti. Diversificazione geografica massima per la parte obbligazionaria. Rischio di cambio valutario se non hedged.',
    'USD Governativi':
      'Titoli di stato americani (Treasury). Il governo USA è il debitore più affidabile al mondo. In dollari — attenzione al rischio cambio EUR/USD se non sei coperto. Ottima diversificazione rispetto ai titoli di stato europei.',
    'USD Corporate':
      'Obbligazioni delle grandi aziende americane (investment grade). Rendimenti superiori ai Treasury USA. In dollari — comporta rischio valutario. Buona diversificazione rispetto al corporate europeo.',
    'ESG Bond':
      'Obbligazioni "verdi" o ESG: il denaro investito finanzia progetti ambientali o aziende con criteri di sostenibilità. Rischio/rendimento simile al corrispondente indice tradizionale, con in più un impatto ESG certificato.',
    'Ultra-Short':
      'Obbligazioni con scadenza brevissima o strumenti monetari (tasso overnight). Praticamente senza rischio di mercato — il capitale si muove pochissimo. Utile per parcheggiare liquidità a breve guadagnando il tasso della banca centrale.',
  },
  Criptovalute: {
    Bitcoin:
      'Bitcoin (BTC) è la prima e più grande criptovaluta. Asset altamente speculativo — può salire o scendere del 50-80% in un anno. Non produce reddito. Ha una supply limitata a 21 milioni di coin. Solo per chi accetta oscillazioni estreme.',
    Ethereum:
      'Ethereum (ETH) è la piattaforma blockchain più usata per smart contract, DeFi e NFT. Il token ETH è il carburante della rete. Più volatile del Bitcoin ma con maggiore utilità tecnologica. Profilo rischio/rendimento estremo.',
    Altcoin:
      'Le "altcoin" sono tutte le criptovalute diverse da Bitcoin ed Ethereum. Potenziale di guadagno molto elevato ma anche rischio di perdere tutto. Molti progetti falliscono — solo per chi sa cosa sta facendo e investe piccole percentuali del portafoglio.',
  },
  'Materie Prime': {
    Oro:
      'Investe in oro fisico o futures. Nessun dividendo né cedola — il rendimento è solo dato dall\'apprezzamento del prezzo. Porto sicuro nelle crisi, protezione dall\'inflazione e dalla svalutazione delle valute.',
    Diversificato:
      'Paniere di materie prime: energia (petrolio, gas), metalli (oro, rame) e agricoltura (grano, mais). Eccellente diversificazione e protezione contro l\'inflazione, ma alta volatilità e costo di gestione.',
    Energia:
      'Futures su petrolio e gas naturale. Il prezzo dipende fortemente dall\'offerta OPEC e dalla domanda globale. Molto speculativo — non adatto come investimento di lungo periodo per i prezzi dei futures (contango).',
    'Metalli Industriali':
      'Rame, alluminio, zinco, nichel: metalli essenziali per costruzioni, elettronica e transizione energetica. Ciclici come l\'economia globale. Il rame in particolare è un ottimo indicatore della crescita economica mondiale.',
  },
  'Multi-Asset': {
    'Multi-Asset':
      'Portfolio pronto: mescola automaticamente azioni, obbligazioni e altre asset class in proporzioni studiate. Ideale per chi non vuole costruire e ribilanciare un portafoglio da solo. La percentuale azionaria determina il profilo di rischio.',
    Diversificato:
      'Combina diverse asset class (azioni, bond, materie prime...) in un unico strumento. Riduce la volatilità sfruttando la correlazione bassa tra asset class diverse. Soluzione semplice per un portafoglio bilanciato.',
  },
}

// ─── Funzione principale ───────────────────────────────────────────────────

export function getEtfDescription(etf: ETFEntry): string {
  const idx = etf.underlyingIndex ?? ''
  const cat = etf.category ?? ''
  const sub = etf.subCategory ?? ''
  const name = etf.name ?? ''

  // 1. Tenta match preciso sull'indice
  for (const { match, desc } of INDEX_DESCRIPTIONS) {
    if (match.test(idx) || match.test(name)) return desc
  }

  // 2. Fallback per categoria + subCategoria
  const catMap = CAT_SUB_DESCRIPTIONS[cat]
  if (catMap) {
    const subDesc = catMap[sub]
    if (subDesc) return subDesc

    // 3. Fallback su categoria generica
    const catFallback: Record<string, string> = {
      Azionari:
        `Investe in azioni del segmento "${sub}". Come tutti gli ETF azionari, nel breve periodo può essere volatile, ma storicamente le azioni sono l\'asset class con il rendimento maggiore nel lungo periodo.`,
      Obbligazionari:
        `Investe in obbligazioni del segmento "${sub}". Più stabile dell\'azionario ma con rendimento inferiore. Utile per ridurre la volatilità del portafoglio.`,
      'Materie Prime':
        `Investe in materie prime del segmento "${sub}". Alta volatilità legata ai mercati fisici. Utile come diversificazione e protezione contro l\'inflazione.`,
    }
    if (catFallback[cat]) return catFallback[cat]
  }

  // 4. Fallback generico
  return `ETF che replica l\'indice "${idx || sub || 'non specificato'}". Controlla la composizione per capire esattamente in cosa investi: leggi il KIID (documento informativo chiave) per i dettagli su rischi e costi.`
}
