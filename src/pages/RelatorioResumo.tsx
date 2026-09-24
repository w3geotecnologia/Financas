import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Wallet, TrendingUp, TrendingDown, DollarSign, Clock, FileText } from 'lucide-react';
import { useAccounts } from '@/contexts/AccountsContext';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const RelatorioResumo: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  const data = useMemo(() => {
    let previous = 0;
    const monthAccs: typeof accounts = [];
    for (const acc of accounts || []) {
      if (!acc.dueDate || acc.description === 'Saldo Anterior') continue;
      const d = new Date(acc.dueDate + 'T00:00:00');
      const y = d.getFullYear(), m = d.getMonth();
      const before = y < year || (y === year && m < month);
      if (before) {
        if (acc.type === 'receita' && acc.status === 'recebido') previous += acc.amount;
        else if (acc.type === 'despesa' && acc.status === 'pago') previous -= Math.abs(acc.amount);
      } else if (y === year && m === month) {
        monthAccs.push(acc);
      }
    }
    const sum = (f: (a: any) => boolean) => monthAccs.filter(f).reduce((s, a) => s + Math.abs(a.amount), 0);
    const recebido = sum(a => a.type === 'receita' && a.status === 'recebido');
    const pago = sum(a => a.type === 'despesa' && a.status === 'pago');
    const aReceber = sum(a => a.type === 'receita' && a.status === 'pendente');
    const aPagar = sum(a => a.type === 'despesa' && a.status === 'pendente');
    const saldoFinal = previous + recebido - pago;
    const saldoPrevisto = saldoFinal + aReceber - aPagar;

    const byCat = (type: 'receita' | 'despesa') => {
      const g: Record<string, number> = {};
      monthAccs.filter(a => a.type === type).forEach(a => {
        const c = a.category || 'Sem Categoria';
        g[c] = (g[c] || 0) + Math.abs(a.amount);
      });
      return Object.entries(g).sort((a, b) => b[1] - a[1]);
    };
    const pendentes = monthAccs
      .filter(a => a.status === 'pendente')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return { previous, recebido, pago, aReceber, aPagar, saldoFinal, saldoPrevisto,
      despesasCat: byCat('despesa'), receitasCat: byCat('receita'), pendentes, total: monthAccs.length };
  }, [accounts, month, year]);

  const fmtDate = (s: string) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

  const summaryRows: [string, number][] = [
    ['Saldo Anterior', data.previous],
    ['Total Recebido', data.recebido],
    ['Total Pago', data.pago],
    ['Saldo Final', data.saldoFinal],
    ['A Receber (pendente)', data.aReceber],
    ['A Pagar (pendente)', data.aPagar],
    ['Saldo Previsto', data.saldoPrevisto],
  ];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const w = doc.internal.pageSize.width;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(51, 65, 85);
      doc.text('Relatório de Resumo Financeiro', w / 2, 14, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Período: ${monthNames[month]}/${year}`, w / 2, 22, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, w / 2, 28, { align: 'center' });

      const head = { fillColor: [59, 130, 246] as [number, number, number], textColor: 255, fontStyle: 'bold' as const };
      autoTable(doc, { startY: 34, head: [['Resumo', 'Valor']], body: summaryRows.map(([l, v]) => [l, formatCurrency(v)]),
        theme: 'grid', headStyles: head, styles: { fontSize: 9 }, columnStyles: { 1: { halign: 'right' } } });

      const next = () => (doc as any).lastAutoTable.finalY + 8;
      if (data.despesasCat.length) autoTable(doc, { startY: next(), head: [['Despesas por Categoria', 'Valor']],
        body: data.despesasCat.map(([c, v]) => [c, formatCurrency(v)]), theme: 'grid', headStyles: { ...head, fillColor: [220, 38, 38] }, styles: { fontSize: 9 }, columnStyles: { 1: { halign: 'right' } } });
      if (data.receitasCat.length) autoTable(doc, { startY: next(), head: [['Receitas por Categoria', 'Valor']],
        body: data.receitasCat.map(([c, v]) => [c, formatCurrency(v)]), theme: 'grid', headStyles: { ...head, fillColor: [22, 163, 74] }, styles: { fontSize: 9 }, columnStyles: { 1: { halign: 'right' } } });
      if (data.pendentes.length) autoTable(doc, { startY: next(), head: [['Vencimento', 'Descrição', 'Tipo', 'Valor']],
        body: data.pendentes.map(a => [fmtDate(a.dueDate), a.description, a.type === 'receita' ? 'Receita' : 'Despesa', formatCurrency(Math.abs(a.amount))]),
        theme: 'grid', headStyles: { ...head, fillColor: [234, 179, 8] }, styles: { fontSize: 8 }, columnStyles: { 3: { halign: 'right' } } });

      doc.save(`resumo-financeiro-${String(month + 1).padStart(2, '0')}-${year}.pdf`);
      toast({ title: 'PDF exportado com sucesso!' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' });
    }
  };

  const cards = [
    { label: 'Saldo Anterior', value: data.previous, icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Total Recebido', value: data.recebido, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Pago', value: data.pago, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Saldo Final', value: data.saldoFinal, icon: DollarSign, color: data.saldoFinal >= 0 ? 'text-blue-600' : 'text-red-600', bg: 'bg-blue-100' },
    { label: 'A Receber', value: data.aReceber, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'A Pagar', value: data.aPagar, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Saldo Previsto', value: data.saldoPrevisto, icon: FileText, color: data.saldoPrevisto >= 0 ? 'text-blue-600' : 'text-red-600', bg: 'bg-sky-100' },
  ];

  const CatList = ({ title, items, color }: { title: string; items: [string, number][]; color: string }) => {
    const total = items.reduce((s, [, v]) => s + v, 0);
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
        {items.length === 0 ? <p className="text-sm text-slate-500">Nenhum lançamento.</p> : (
          <div className="space-y-2">
            {items.map(([c, v]) => (
              <div key={c}>
                <div className="flex justify-between text-sm"><span className="text-slate-600">{c}</span><span className="font-semibold">{formatCurrency(v)}</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-1"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2"><ArrowLeft size={16} />Voltar</Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Relatório do Resumo Financeiro</h1>
              <p className="text-sm text-slate-500">{data.total} lançamentos no período</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></Button>
            <span className="font-semibold text-slate-700 min-w-[130px] text-center">{monthNames[month]} {year}</span>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}><ChevronRight size={16} /></Button>
            <Button onClick={handleExportPDF} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"><Download size={16} />Exportar PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
              <div><p className="text-xs text-slate-500">{c.label}</p><p className={`text-base sm:text-lg font-bold ${c.color}`}>{formatCurrency(c.value)}</p></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CatList title="Despesas por Categoria" items={data.despesasCat} color="bg-red-500" />
          <CatList title="Receitas por Categoria" items={data.receitasCat} color="bg-green-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Contas Pendentes</h3>
          {data.pendentes.length === 0 ? <p className="text-sm text-slate-500">Nenhuma conta pendente.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Vencimento</th><th>Descrição</th><th>Tipo</th><th className="text-right">Valor</th></tr></thead>
                <tbody>
                  {data.pendentes.map(a => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2">{fmtDate(a.dueDate)}</td><td>{a.description}</td>
                      <td className={a.type === 'receita' ? 'text-green-600' : 'text-red-600'}>{a.type === 'receita' ? 'Receita' : 'Despesa'}</td>
                      <td className="text-right font-semibold">{formatCurrency(Math.abs(a.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RelatorioResumo;
