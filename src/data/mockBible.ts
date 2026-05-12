// Estructura idéntica a la que tendrá la colección "bible_chapters"
export const MOCK_BIBLE: Record<string, any> = {
  "1_1": {
    libro: "Génesis",
    libroNum: 1,
    cap: 1,
    versiculos: [
      { ver: 1, texto: "En el principio crió Dios los cielos y la tierra." },
      { ver: 2, texto: "Y la tierra estaba desordenada y vacía..." }
    ]
  },
  "19_23": {
    libro: "Salmos",
    libroNum: 19,
    cap: 23,
    versiculos: [
      { ver: 1, texto: "Jehová es mi pastor; nada me faltará." },
      { ver: 2, texto: "En lugares de delicados pastos me hará yacer..." }
    ]
  },
  "43_3": {
    libro: "Juan",
    libroNum: 43,
    cap: 3,
    versiculos: [
      { ver: 16, texto: "Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito..." }
    ]
  }
};