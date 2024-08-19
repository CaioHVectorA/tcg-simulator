import { swagger as sw } from '@elysiajs/swagger'
export const swagger = sw({
    path: '/docs',
    documentation: {
        info : {
            title: "Api Packages",
            description: 'Uma API que gerencia contas de usuários e pacotes de cartas pokemon, se inspirando no pokemon TCGO',
            version: '1.0.0',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            },
            contact: { 
                email: "caihebatista@gmail.com",
                name: "Caio Henrique",
                url: "caihe.vercel.app"
             }
        },
        tags: [
            {
                name: "Auth",
                description: "Endpoints relacionados a autenticação de usuários"
            },
            {
                name: "Trade",
                description: "Endpoints relacionados a troca de cartas"
            },
            {
                name: "Card",
                description: "Endpoints relacionados a cartas"
            },
            {
                name: "Package",
                description: "Endpoints relacionados a pacotes de cartas"
            }
        ]
    }
}) 