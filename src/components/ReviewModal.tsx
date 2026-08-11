import { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Textarea } from './ui/Field';
import { StarPicker } from './ui/Rating';

export function ReviewModal({
  open, onClose, contractId, fromId, fromName, toId, toName,
}: {
  open: boolean;
  onClose: () => void;
  contractId: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
}) {
  const { submitReview } = useApp();
  const { notify } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = () => {
    if (!comment.trim()) { notify('Escreva um comentário', 'warning'); return; }
    submitReview(contractId, fromId, fromName, toId, rating, comment.trim());
    notify('Avaliação enviada com sucesso!');
    setRating(5);
    setComment('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Avaliação recíproca pós-serviço" subtitle={`Avaliando ${toName}`} size="md"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={submit}><Check className="h-4 w-4" /> Enviar avaliação</Button></div>}>
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2 py-2">
          <Star className="h-10 w-10 text-warning-400" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Como foi a experiência com <strong className="text-neutral-800 dark:text-neutral-100">{toName}</strong>?</p>
        </div>
        <div className="flex justify-center">
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <Textarea label="Comentário" rows={4} placeholder="Conte sobre pontualidade, profissionalismo, qualidade do serviço..." value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
    </Modal>
  );
}
