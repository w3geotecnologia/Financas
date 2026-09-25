import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreditCardsData } from '@/hooks/useCreditCardsData';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';

const formatDueDay = (dueDate?: string) => {
  if (!dueDate) return null;
  const iso = dueDate.split('T')[0];
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  const day = Number(dueDate);
  return Number.isFinite(day) && day > 0 ? `Dia ${day}` : null;
};

const lastFourDigits = (cardNumber: string) => {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '•');
};

export const CreditCardsOverviewCard: React.FC = () => {
  const { creditCards, isLoading } = useCreditCardsData();
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 flex flex-col"
      style={{ height: '420px' }}
    >
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Cartões</h3>
        <Button
          type="button"
          variant="link"
          onClick={() => navigate('/cartoes-credito')}
          className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700"
        >
          Ver todos
        </Button>
      </div>

      <div
        className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        {isLoading && (
          <p className="text-sm text-slate-400 py-6 text-center">Carregando...</p>
        )}

        {!isLoading && creditCards.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">Nenhum cartão cadastrado.</p>
        )}

        {!isLoading && creditCards.length > 0 && (
          <div className="space-y-3">
            {creditCards.map((card) => {
              const used = Number(card.current_value || 0);
              const due = formatDueDay(card.due_date);

              return (
                <div
                  key={card.id}
                  className="rounded-lg border border-slate-200 p-3.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                      {card.card_name}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      •••• {lastFourDigits(card.card_number)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase text-slate-500">Fatura atual</p>
                      <p className="mt-0.5 text-base font-bold text-red-500">
                        {formatCurrency(used)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium uppercase text-slate-500">Vencimento</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">{due || '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
