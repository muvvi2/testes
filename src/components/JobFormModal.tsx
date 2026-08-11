import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Job, Urgency, User } from '@/types';
import { uid, urgencyLabel } from '@/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Textarea, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';

export function JobFormModal({ open, onClose, editing, establishment }: { open: boolean; onClose: () => void; editing: Job | null; establishment: User }) {
  const { data, addJob, updateJob } = useApp();
  const { notify } = useToast();

  const currentEstablishment = data.users.find((u) => u.id === establishment.id) ?? establishment;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState(editing?.category ?? 'garcom');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(editing?.startTime ?? '18:00');
  const [hours, setHours] = useState(String(editing?.hours ?? 6));
  const [value, setValue] = useState(String(editing?.value ?? 200));
  const [urgency, setUrgency] = useState<Urgency>(editing?.urgency ?? 'hoje');

  // Descobre a macro inicial com base na categoria atual
  const initialCategoryObj = CATEGORIES.find(c => c.id === (editing?.category ?? 'garcom'));
  const [selectedMacro, setSelectedMacro] = useState<string>(initialCategoryObj?.macro ?? MACRO_CATEGORIES[0]?.id ?? 'tecnico');

  // Filtra as especialidades com base na macro selecionada
  const filteredCategories = CATEGORIES.filter((cat: any) => cat.macro === selectedMacro);

  const handleMacroChange = (newMacro: string) => {
    setSelectedMacro(newMacro);
    // Seleciona automaticamente a primeira especialidade da nova macro para evitar inconsistência
    const firstCatOfMacro = CATEGORIES.find((cat: any) => cat.macro === newMacro);
    if (firstCatOfMacro) {
      setCategory(firstCatOfMacro.id);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { notify('Informe um título para a vaga', 'warning'); return; }

    try {
      if (editing) {
        const result = await updateJob(editing.id, { 
          title, 
          category, 
          description, 
          date: new Date(date).toISOString(), 
          startTime, 
          hours: Number(hours) || 1, 
          value: Number(value) || 0, 
          urgency 
        });

        if (result && !result.ok) {
          notify(result.error ?? 'Erro ao atualizar a vaga.', 'error');
          return;
        }

        notify('Vaga atualizada com sucesso!');
        onClose();
      } else {
        const job: Job = {
          id: uid('job'),
          establishmentId: currentEstablishment.id,
          establishmentName: currentEstablishment.name,
          establishmentPhoto: currentEstablishment.photo,
          category,
          title,
          description,
          date: new Date(date).toISOString(),
          startTime,
          hours: Number(hours) || 1,
          value: Number(value) || 0,
          urgency,
          status: 'active',
          city: currentEstablishment.address.city,
          state: currentEstablishment.address.state,
          applicants: [],
          createdAt: new Date().toISOString(),
        };

        const result = await addJob(job);

        if (result && !result.ok) {
          notify(result.error ?? 'Limite de vagas atingido para o seu plano.', 'error');
          return; 
        }

        notify('Vaga urgente publicada no feed!');
        onClose();
      }
    } catch (err: any) {
      console.error('Erro crítico ao salvar vaga:', err);
      notify(err.message || 'Erro inesperado ao salvar vaga', 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar vaga' : 'Publicar vaga urgente'} subtitle="Aparece instantaneamente no feed dos freelancers" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={handleSave}><Check className="h-4 w-4" /> {editing ? 'Salvar' : 'Publicar'}</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Título da vaga" placeholder="Ex: Cobertura de sexta à noite" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        
        <Select label="Setor Principal (Macro)" value={selectedMacro} onChange={(e) => handleMacroChange(e.target.value)}>
          {MACRO_CATEGORIES.map((macro) => (
            <option key={macro.id} value={macro.id}>{macro.label}</option>
          ))}
        </Select>

        <Select label="Especialidade Específica" value={category} onChange={(e) => setCategory(e.target.value)}>
          {filteredCategories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </Select>

        <Select label="Urgência" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
          {(['hoje', 'amanha', 'esta_semana'] as Urgency[]).map((u) => <option key={u} value={u}>{urgencyLabel(u)}</option>)}
        </Select>
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Horário" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <Input label="Duração (horas)" type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} />
        <Input label="Valor (R$)" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
        <div className="sm:col-span-2">
          <Textarea label="Descrição" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes adicionais sobre a vaga..." />
        </div>
      </div>
    </Modal>
  );
}
