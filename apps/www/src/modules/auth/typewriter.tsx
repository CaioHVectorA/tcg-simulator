import { Typewriter as TW } from 'react-simple-typewriter'
export function Typewriter() {
    return (
        <TW
            words={['Obtenha', 'Colecione', 'Troque', 'Acumule']}
            loop={5}
            cursor
            cursorStyle='|'
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1000}
        // onLoopDone={handleDone}
        // onType={handleType}
        />
    )
}