/*
 * Rêve & Réalités : configuration du site (SEUL fichier à éditer pour les infos réelles).
 *
 * Tant qu'une valeur est vide (''), l'élément correspondant reste MASQUÉ ou
 * affiche un message honnête : rien n'est inventé ni simulé.
 *
 * NOTE : le téléphone (+216 27 630 777) et l'URL Facebook figurent aussi EN DUR dans les
 * 4 pages HTML, pour rester visibles sans JavaScript et lisibles par les moteurs de recherche.
 * Si vous les modifiez ici, l'affichage se met à jour, mais pensez à les changer aussi
 * dans les pages (recherche : « 27 630 777 » et « profile.php?id= ») et dans les données
 * structurées de chaque page.
 *
 * SEO — À FAIRE UNE FOIS LE VRAI DOMAINE CONNU :
 * remplacer "votre-domaine.tn" par le nom de domaine réel dans robots.txt, sitemap.xml
 * et dans les 4 pages HTML (balises <link rel="canonical">, og:url, og:image, twitter:image
 * et données structurées JSON-LD). Recherche : « votre-domaine.tn ».
 */
window.RR_CONFIG = {
  // URL Instagram officielle (déjà utilisée en dur dans les pages).
  instagramUrl: 'https://www.instagram.com/reve.et.realites/',

  // Page Facebook officielle (fournie par le client).
  // Vide = les liens « Facebook » (footers + page Contact) restent masqués.
  facebookUrl: 'https://www.facebook.com/profile.php?id=61583974790129',

  // Téléphone réel (fourni par le client), format international.
  // Vide = la ligne « Téléphone » reste masquée.
  phone: '+216 27 630 777',

  // À RENSEIGNER : e-mail réel de contact.
  // ex. 'contact@votre-domaine.tn'. Vide = la ligne « Courriel » reste masquée.
  email: '',

  // À RENSEIGNER : point de réception du formulaire de devis (service d'envoi d'e-mails).
  // Le formulaire envoie un POST JSON à cette URL et n'affiche « succès » que si le
  // service répond OK. Exemples compatibles :
  //   Formspree : 'https://formspree.io/f/xxxxxxxx'
  //   FormSubmit: 'https://formsubmit.co/ajax/votre@email.tn'
  //   Web3Forms : 'https://api.web3forms.com/submit' (+ formExtraFields ci-dessous)
  // Vide = le formulaire valide les champs, mais affiche « envoi indisponible »
  // au lieu de simuler un envoi.
  formEndpoint: '',

  // Champs supplémentaires envoyés avec chaque demande si le service l'exige.
  // ex. Web3Forms : { access_key: 'VOTRE_CLE_PUBLIQUE' }
  formExtraFields: {}
};
