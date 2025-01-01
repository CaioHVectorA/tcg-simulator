import * as React from 'react'
import { ArrowRight, Coffee, Gift, Package, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default async function LandingPage(data: any) {
  // const cook = await cookies()
  // const token = cook.get('token')
  // if (token?.value) {
  //   redirect('/home')
  // }
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/wallpaper.jpg" alt="TCG Logo" className="w-12 h-12 rounded-full object-cover" />
            <span className="text-3xl font-bold">Pokémon TCG Simulator</span>
          </div>
          <nav>
            <a href="/entrar" className="text-primary-foreground hover:underline text-lg">
              Entrar
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-24">
        <section className="text-center">
          <h1 className="text-5xl font-bold mb-6">Bem-vindo ao Pokémon TCG Simulator</h1>
          <p className="text-2xl mb-8 font-syne"><b>De treinadores para treinadores</b>: Troque, abra pacotes e colecione no universo de cartas pokemon!</p>
          <Button asChild size="lg" className="text-xl py-6 px-8">
            <a href="/entrar">
              Comece a jogar agora <ArrowRight className="ml-2 h-6 w-6" />
            </a>
          </Button>
        </section>

        <section className="grid grid-cols-1 font-syne md:grid-cols-3 gap-4">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl font-syne">Colecione</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg xl">Monte sua coleção com seus pokémon favoritos e com as mais bonitas cartas! O SimTcg possui as cartas mais raras e até<i> as que foram esquecidas.</i></p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl font-syne">Chegue ao topo</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg xl">Conforme você consegue cartas das mais raras, você acumula pontos de raridade. Quem não quer subir ao pódio?</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl font-syne">Abra pacotes</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg xl">O que não podia faltar: A emoção de abrir pacotes e conseguir cartas em situações das mais improváveis! É claro que isso não iria faltar.</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className=' flex gap-2 flex-row justify-between'>
              <CardTitle className="text-3xl font-syne">Troque</CardTitle>
              <Badge className="">Em breve</Badge>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg xl">Conecte-se com treinadores e faça trocas para expandir sua coleção! Negocie, pechinche e consiga a sua carta mais procurada!</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className=' flex gap-2 flex-row justify-between'>
              <CardTitle className="text-3xl font-syne">Faça amigos!</CardTitle>
              <Badge className="">Em breve</Badge>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg xl">Consiga novas amizades e forme alianças. Um treinador não sobe até os pódios sozinho!</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className=' flex gap-2 flex-row justify-between'>
              <CardTitle className="text-3xl font-syne">Batalhe</CardTitle>
              <Badge className="">muito em breve</Badge>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-lg xl">Teste suas habilidades em emocionantes duelos contra outros treinadores e prove seu valor! Participe de torneios, suba no ranking e torne-se uma lenda do TCG.</p>
            </CardContent>
          </Card>
        </section>

        <section className="bg-accent rounded-lg p-12 border">
          <h2 className="text-3xl font-bold mb-6 text-center">Bônus de Boas-vindas</h2>
          <p className="text-xl text-center mb-8">Registre-se agora e ganhe 3000 moedas para começar sua jornada com o pé direito!</p>
          <div className="flex justify-center">
            <Button asChild variant="outline" size="lg" className="text-xl py-6 px-8">
              <a href="/entrar?with_bonus=true">
                <Gift className="mr-2 h-6 w-6" /> Resgatar Bônus
              </a>
            </Button>
          </div>
        </section>
        {/* 
        <section className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-6">De Jogadores para Jogadores</h2>
            <p className="text-xl mb-6">
              O Pokémon TCG Simulator foi criado por fãs apaixonados, para fãs como você! Nossa plataforma oferece uma experiência autêntica e divertida de colecionar, trocar e batalhar com cards Pokémon, tudo isso de forma totalmente gratuita.
            </p>
            <p className="text-xl">
              Aqui, você encontrará uma comunidade vibrante de treinadores prontos para compartilhar estratégias, trocar cards raros e competir em emocionantes torneios. Seja você um novato curioso ou um veterano experiente, há sempre algo novo para descobrir e aprender no nosso simulador.
            </p>
          </div>
          <div className="md:w-1/2">
            <img src="/wallpaper.jpg" alt="Comunidade de jogadores" className="w-full h-96 object-cover rounded-lg shadow-lg" />
          </div>
        </section>

        <section>
          <h2 className="text-4xl font-bold mb-6 text-center">Mecânicas Simples, Diversão Garantida</h2>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img src="/wallpaper.jpg" alt="Mecânicas do jogo" className="w-full h-96 object-cover rounded-lg shadow-lg" />
            </div>
            <div className="md:w-1/2">
              <p className="text-xl mb-6">
                Não se preocupe se você é novo no mundo dos jogos de cartas colecionáveis. O Pokémon TCG Simulator foi projetado para ser intuitivo e fácil de aprender, mesmo para iniciantes.
              </p>
              <p className="text-xl mb-6">
                Nossas mecânicas simplificadas permitem que você comece a jogar e se divertir imediatamente, enquanto descobre as melhores cartas e estratégias ao longo do tempo.
              </p>
              <p className="text-xl">
                Com tutoriais interativos, dicas úteis e uma comunidade acolhedora, você estará batalhando como um profissional em pouco tempo!
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-4xl font-bold mb-8 text-center">Experimente a Emoção de Abrir Pacotes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
            {['Booster Básico', 'Pacote Raro', 'Edição Especial'].map((pack, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">{pack}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <img src="/wallpaper.jpg" alt={pack} className="w-full h-80 object-cover mb-6 rounded-md" />
                  <CardDescription className="text-lg">
                    Descubra cards incríveis e potencialmente raros neste emocionante pacote {pack.toLowerCase()}!
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full text-lg py-6">
                    <a href="/entrar">
                      <Package className="mr-2 h-5 w-5" /> Abrir Pacote
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section> */}

        <section className="text-center border px-[12%] py-12">
          <h2 className="text-4xl font-bold mb-6">Apoie o Projeto</h2>
          <p className="text-xl mb-8">Ajude-nos a manter o Pokémon TCG Simulator gratuito e em constante evolução! Sua contribuição nos permite trazer novos recursos, cards e eventos para toda a comunidade.</p>
          <Button variant="outline" asChild size="lg" className="text-xl py-6 px-8">
            <a href="#support">
              <Coffee className="mr-2 h-6 w-6" /> Me Pague um Café
            </a>
          </Button>
        </section>
      </main>

      <footer className="bg-muted py-8 mt-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg">&copy; 2024 Pokémon TCG Simulator. Todos os direitos reservados.</p>
          <p className="mt-4 text-lg">Criado com amor por treinadores, para treinadores.</p>
        </div>
      </footer>
    </div>
  )
}