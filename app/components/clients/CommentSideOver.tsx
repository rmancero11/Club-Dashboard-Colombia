import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/Dialog';
import { Button } from '../ui/Button';

type CommentSideOverProps = {
  comment?: string;
  clientFistName?: string;
};

export default function CommentDialog ({ comment, clientFistName }: CommentSideOverProps) {
  return (
    <Dialog>
    <DialogTrigger asChild>
      <Button>Leer</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{`Comentario de ${clientFistName}`}</DialogTitle>
        <DialogDescription>
          Siempre toma en cuenta el feedback de tus clientes.
        </DialogDescription>
      </DialogHeader>
      <div >
        <p className='text-sm text-muted-foreground'>{comment}</p>
      </div>
      <DialogFooter>
        <DialogTrigger asChild>
          <Button>Cerrar</Button>
        </DialogTrigger>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}
