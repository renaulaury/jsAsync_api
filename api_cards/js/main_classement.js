/*************** Ecoutes d'event et leur déclenchement ***************/

//element html utiles pour les events et manip du dom
const actionResetButton = document.getElementById("action-reset");
const actionDrawButton = document.getElementById("action-draw");

//Ecoutes d'event sur les boutons
actionResetButton.addEventListener("click", actionReset);
actionDrawButton.addEventListener("click", actionDraw);




// fonction qui fait le fetch() et contacte l api
async function callApi(uri) {
    console.log("-- callAPI - start --");
    console.log("uri = ", uri)

    try {
    //fetch(), appel a l api et reception de la reponse
    const response = await fetch(uri);
    console.log("response = ", response);

        if (response.ok) { //pour confirmer que le statut HTTP est dans la plage de succès (200-299)

            //Récupération des données JSON recues de l api
            const data = await response.json();
            console.log("data = ", data);

            console.log("-- callAPI - end --");

            //renvoi des données
            return data;
        } else {
            console.error(`Erreur HTTP : ${response.status} - ${response.statusText}`); //description de l echec ex : 404
            alert("Impossible de récupérer les données. Veuillez réessayer plus tard.");
        }
    } catch (error) {
        console.error("Erreur lors de l'appel API : ", error.message); // description de l error capturée 
        alert("Impossible de récupérer les données. Veuillez réessayer plus tard.");
    }
}

/*************** Demande d'un nouveau deck ***************/
//l'uri du endpoint de dde de nouveau deck
const API_ENDPOINT_NEW_DECK = "https://deckofcardsapi.com/api/deck/new"; //url recupéré sur api des cartes

//fonction de dde de nouveau deck
async function getNewDeck() {
    return await callApi(API_ENDPOINT_NEW_DECK);
}

/*************** Mélange du deck ***************/

//on pioche
let idDeck = null;

//fonction fléchée qui renvoie uri dyn de dde de mélange du deck et de pioche
const getApiEndpointShuffleDeck = () => `https://deckofcardsapi.com/api/deck/${idDeck}/shuffle/`;


//Fonction qui mélange le deck
async function shuffleDeck() {
    return await callApi(getApiEndpointShuffleDeck());
}


/*************** Récupération des cartes piochées ***************/

// on aura besoin de let idDeck = null; initialisé L32

//fonction fléchée qui renvoie uri dyn de dde de mélange du deck et de pioche
const getApiEndpointDrawCard = () => `https://deckofcardsapi.com/api/deck/${idDeck}/draw/?count=1`;

//fonction de dde de pioche dans le deck
async function drawCard() {
    return await callApi(getApiEndpointDrawCard());
}


/*************** Nettoyage avt recup du nouveau deck ***************/ 

// on aura besoin de let idDeck = null; initialisé L32

//supprime les carte de l'ancien deck du DOM
const cleanDomCardsFromPreviousDeck = () =>

    //Récup des cartes par class CSS    
    document.querySelectorAll(".card")
    
    //et pour chacune de ces cartes
    .forEach((child) => child.remove());


//ré init (dde new deck + melange)

async function actionReset() {

    //vider le DOM de l ancien deck
    cleanDomCardsFromPreviousDeck();

    //recup new deck
    const newDeckResponse = await getNewDeck();

    //recup id du new deck dans les datas recues et maj variables globale
    idDeck = newDeckResponse.deck_id;

    //melange du deck
    await shuffleDeck();
}



/******************* Mise en place des piles **********************/

//fonction fléchée qui ajoute les cartes a une pile
const getApiEndpointAddToPile = (pileName, cardCode) => 
    `https://deckofcardsapi.com/api/deck/${idDeck}/pile/${pileName}/add/?cards=${cardCode}`;



//element html utiles pour les event et pour la manip du dom
const  cardsContainer = document.getElementById("cards-container");

//fonction créer une pile
function createContainPile(suit) {
    const pileHtmlElement = document.createElement("div");
    pileHtmlElement.classList.add(suit);
    cardsContainer.append(pileHtmlElement);
    return pileHtmlElement;
}

// Fonction pour trier les cartes dans le DOM
function sortCardsInDom(pileHtmlElement) {
    const cards = Array.from(pileHtmlElement.querySelectorAll(".card"));

    cards.sort((a, b) => {
        const codeA = a.classList[0];
        const codeB = b.classList[0];
        return getCardIndexByCode(codeA) - getCardIndexByCode(codeB);
    });

    cards.forEach((card) => pileHtmlElement.append(card));
}


// Fonction pour ajouter une carte à la pile correspondante
async function addCardToDomBySuit(suit, imgUri, code) {
    // Recherche de la div correspondant au suit
    let pileHtmlElement = document.querySelector(`.${suit}`);


    // Si la div n'existe pas encore, on la crée
    if (!pileHtmlElement) {
        pileHtmlElement = createContainPile(suit);
    }
    
    //creation element html 'img' class css "card" et attribut html "src" : l uri sera recue en argument
    const imgCardHtmlElement = document.createElement("img");    
    imgCardHtmlElement.classList.add(code);  
    imgCardHtmlElement.classList.add('card');    
    imgCardHtmlElement.src = imgUri;

    // Trouver la bonne position dans la pile (par rapport à l'ordre des cartes)
    const cards = Array.from(pileHtmlElement.querySelectorAll(".card"));
    let inserted = false;

    //parcours des class presentes pour inserer la new card
    for (let i = 0; i < cards.length; i++) {
        const currentCardCode = cards[i].classList[0]; // Le code de la carte existante
        if (getCardIndexByCode(code) < getCardIndexByCode(currentCardCode)) {
            pileHtmlElement.insertBefore(imgCardHtmlElement, cards[i]);
            inserted = true;
            break;
        }
    }

    //si on insere pas avant alors apres
    if (!inserted) {
        pileHtmlElement.append(imgCardHtmlElement); // Si ce n'est pas inséré avant, on l'ajoute à la fin
    }
  
    // Ajout de l'image dans la pile correspondante
    pileHtmlElement.append(imgCardHtmlElement);

    // Ajout de la carte dans la pile côté API
    const uriAddToPile = getApiEndpointAddToPile(suit.toLowerCase(), code);
    await callApi(uriAddToPile);
}

// Ordres des cartes
const valueOrder = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Ordre des suits
const suitOrder = ["H", "S", "D", "C"]; 


function getCardIndexByCode(code) {
    const valuePart = code.slice(0, -1); // Extrait la valeur (ex : "4", "A")
    const suitPart = code.slice(-1);    // Extrait le suit (ex : "D", "H")

    const valueIndex = valueOrder.indexOf(valuePart);
    const suitIndex = suitOrder.indexOf(suitPart);

    return suitIndex * valueOrder.length + valueIndex;
}



 

/*************************** Pioche ****************************/
//fonction qui dde a piocher une carte puis qui fait appel pour l integrer dans le dom
async function actionDraw() {

    // l appel a l api pour dder au croupier de piocher une carte et de nous la renvoyer
    const drawCardResponse = await drawCard();

    //recup uri de l img de cette carte dans les données recues
    const imgUri = drawCardResponse.cards[0].image;

    // Le suit de la carte tirée
    const suit = drawCardResponse.cards[0].suit; 

    // Le code de la carte tirée    
    const code = drawCardResponse.cards[0].code;
    
    
    // Ajout de la carte à la bonne pile
    addCardToDomBySuit(suit, imgUri, code);    
}



/*je crée une div qui a pour class le suit soit 4 au total -> createContainPile */
/*je pioche (actionDraw), si le suit de la carte a une div avec le meme suit alors elle est ajoutée a la pile -> (addCardToDomBySuit)*/
/*sinon création d'une div avec son suit puis ajout a cette pile*/





/*************** appel ini lancement de l appli ***************/
actionReset();

