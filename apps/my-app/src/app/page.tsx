import * as React from 'react'
import { ArrowRight, Coffee, Gift, Package, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
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
          <p className="text-2xl mb-8">De treinadores para treinadores: Colecione, troque e batalhe gratuitamente no universo Pokémon!</p>
          <Button asChild size="lg" className="text-xl py-6 px-8">
            <a href="/entrar">
              Comece a jogar agora <ArrowRight className="ml-2 h-6 w-6" />
            </a>
          </Button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Colecione</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <img src="/wallpaper.jpg" alt="Coleção de cards" className="w-full h-60 object-cover mb-6 rounded-md" />
              <p className="text-lg">Monte sua coleção única de cards Pokémon e torne-se um verdadeiro Mestre Pokémon! Abra pacotes, complete missões e participe de eventos para expandir seu acervo.</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Troque</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <img src="/wallpaper.jpg" alt="Troca de cards" className="w-full h-60 object-cover mb-6 rounded-md" />
              <p className="text-lg">Conecte-se com treinadores do mundo todo e faça trocas incríveis para expandir sua coleção! Negocie cards raros, forme alianças e construa seu deck dos sonhos.</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Batalhe</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <img src="/wallpaper.jpg" alt="Batalha de cards" className="w-full h-60 object-cover mb-6 rounded-md" />
              <p className="text-lg">Teste suas habilidades em emocionantes duelos contra outros treinadores e prove seu valor! Participe de torneios, suba no ranking e torne-se uma lenda do TCG.</p>
            </CardContent>
          </Card>
        </section>

        <section className="bg-accent rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Bônus de Boas-vindas</h2>
          <p className="text-xl text-center mb-8">Registre-se agora e ganhe 3000 moedas para começar sua jornada com o pé direito!</p>
          <div className="flex justify-center">
            <Button asChild variant="secondary" size="lg" className="text-xl py-6 px-8">
              <a href="/entrar">
                <Gift className="mr-2 h-6 w-6" /> Resgatar Bônus
              </a>
            </Button>
          </div>
        </section>

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
        </section>

        <section className="text-center">
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