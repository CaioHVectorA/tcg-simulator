import { LoadingRing } from '@/components/loading-spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetch } from '@/hooks/use-fetch';
import { loadTcgImg } from '@/lib/load-tcg-img';
import { useState } from 'react';
import Image from 'next/image';

interface UserPackageProps {
    packageData: UserPackage;
}

export const UserPackage: React.FC<UserPackageProps> = ({ packageData }) => {
    const [isFlipped, setIsFlipped] = useState(false)

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    return (
        <Card
            className="w-[64%] max-w-sm mx-auto cursor-pointer"
            onClick={handleFlip}
        >
            <CardHeader>
                <CardTitle>{packageData.name}</CardTitle>
            </CardHeader>
            <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div style={{ backfaceVisibility: 'hidden' }}>
                    <CardContent>
                        <div className="relative w-full aspect-[2/3]">
                            <Image
                                src={loadTcgImg(packageData.image_url)}
                                alt={packageData.name}
                                layout="fill"
                                objectFit="contain"
                                className="rounded-lg"
                            />
                        </div>
                    </CardContent>
                    {/* <CardFooter>
                        <p>Quantity: {packageData.quantity}</p>
                    </CardFooter> */}
                </div>
                <motion.div
                    style={{
                        backfaceVisibility: 'hidden',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        transform: 'rotateY(180deg)',
                    }}
                    className="flex items-center justify-center bg-primary text-primary-foreground rounded-lg"
                >
                    <p className="text-2xl font-bold">Package ID: {packageData.id}</p>
                </motion.div>
            </motion.div>
        </Card>
    )
}

export function OpenPackagePopup({
    quantity, pack
}: {
    quantity: number;
    pack: UserPackage;
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="w-full">Abrir</Button>
            </AlertDialogTrigger>
            <AlertDialogPortal>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader className=' sr-only'>
                            <AlertDialogTitle>Abrindo pacote</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription asChild className=' w-full h-full'>
                            {/* <div className=' flex flex-col'>
                                <h2 className=' text-lg'>{pack.name}</h2>
                                <img src={loadTcgImg(pack.image_url)} alt={pack.name} className="w-6/12 aspect-[1/1.4] object-contain rounded-md" />
                            </div> */}
                            <UserPackage packageData={pack} />
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogAction>Abrir todos</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialogPortal>
        </AlertDialog>
    )
}