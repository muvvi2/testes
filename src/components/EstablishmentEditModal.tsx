import { useState } from 'react';
import { Check } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { maskCNPJ, maskPhone, maskCEP } from '@/utils';

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function EstablishmentEditModal({ establishment, open, onClose }: { establishment: User; open: boolean; onClose: () => void }) {
  const { updateUser } = useApp();
  const { notify } = useToast();
  
  const [name, setName] = useState(establishment.name);
  const [photo, setPhoto] = useState(establishment.photo || '');
  const [establishmentType, setEstablishmentType] = useState(establishment.establishmentType ?? 'Bar & Restaurante');
  const [cep, setCep] = useState(establishment.address.cep ?? '');
  const [street, setStreet] = useState(establishment.address.street || '');
  const [number, setNumber] = useState(establishment.address.number || '');
  const [complement, setComplement] = useState(establishment.address.complement || '');
  const [neighborhood, setNeighborhood] = useState(establishment.address.neighborhood ?? '');
  const [city, setCity] = useState(establishment.address.city || '');
  const [state, setState] = useState(establishment.address.state || 'SP');
  const [phone, setPhone] = useState(establishment.phone || '');
  const [whatsapp, setWhatsapp] = useState(establishment.whatsapp || '');
  const [email, setEmail] = useState(establishment.email || '');
  const [cnpj, setCnpj] = useState(establishment.cnpj ?? '');

  const handleSave = () => {
    updateUser(establishment.id, { 
      name, 
      photo, 
      establishmentType, 
      address: { ...establishment.address, cep, street, number, complement, neighborhood, city, state }, 
      phone, 
      whatsapp, 
      email, 
      cnpj
    }); 
    onClose(); 
    notify('Estabelecimento atualizado com sucesso!'); 
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar cadastro do estabelecimento" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={handleSave}><Check className="h-4 w-4" /> Salvar alterações</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Nome do Negócio / Estabelecimento" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} />
        <Select label="Tipo de estabelecimento" value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)}>
          {['Bar & Restaurante', 'Buffet & Eventos', 'Restaurante', 'Bar', 'Lanchonete', 'Padaria', 'Casa de Shows', 'Hotel'].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <div className="sm:col-span-2">
          <Input label="URL da Foto / Logotipo da Empresa" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://exemplo.com/logo.jpg" />
        </div>
        <Input label="E-mail de Contato" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />
        
        {/* Bloco de Endereço */}
        <div className="sm:col-span-2 mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Endereço Comercial</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="CEP" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} />
            <div className="sm:col-span-2"><Input label="Logradouro (Rua)" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
            <Input label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
            <Input label="Complemento" value={complement} onChange={(e) => setComplement(e.target.value)} />
            <Input label="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
            <Select label="Estado (UF)" value={state} onChange={(e) => setState(e.target.value)}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
