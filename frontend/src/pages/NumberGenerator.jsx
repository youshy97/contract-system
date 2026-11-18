import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Check,
  ClipboardList,
  Copy,
  Download,
  FileText,
  FilePlus2,
  Hash,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import api from '../services/api'

const TYPE_LABELS = { CTR: 'عقد', INV: 'فاتورة' }
const ERROR_MESSAGES = {
  409: 'اسم الشركة أو رمزها مستخدم مسبقاً.',
  401: 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى.',
  403: 'ليس لديك صلاحية تنفيذ هذا الإجراء.',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function NumberGenerator() {
  const [companies, setCompanies] = useState([])
  const [records, setRecords] = useState([])
  const [companyId, setCompanyId] = useState('')
  const [docType, setDocType] = useState('CTR')
  const [search, setSearch] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [newest, setNewest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedCompany = companies.find((company) => String(company.id) === String(companyId))
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return records
    return records.filter((row) => [row.number, row.company_name, row.created_by_name, TYPE_LABELS[row.document_type]]
      .some((value) => String(value || '').toLocaleLowerCase().includes(term)))
  }, [records, search])

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [companyResponse, numberResponse] = await Promise.all([
        api.get('/numbering/companies'),
        api.get('/numbering/numbers', { params: { limit: 500 } }),
      ])
      setCompanies(companyResponse.data)
      setRecords(numberResponse.data)
      setCompanyId((current) => current || String(companyResponse.data[0]?.id || ''))
    } catch (requestError) {
      setError(ERROR_MESSAGES[requestError.response?.status] || 'تعذر الاتصال بالخادم. تحقق من إعدادات النشر وحاول مجدداً.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function generateNumber() {
    if (!companyId) return setError('أضف شركة أو اختر شركة أولاً.')
    setGenerating(true)
    setError('')
    setNotice('')
    try {
      const response = await api.post('/numbering/generate', {
        company_id: Number(companyId), document_type: docType,
      })
      setNewest(response.data)
      setRecords((current) => [response.data, ...current])
      setNotice(`تم توليد رقم ${TYPE_LABELS[docType]} وحجزه بنجاح.`)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || ERROR_MESSAGES[requestError.response?.status] || 'تعذر توليد الرقم حالياً.')
    } finally {
      setGenerating(false)
    }
  }

  async function addCompany(event) {
    event.preventDefault()
    setSavingCompany(true)
    setError('')
    setNotice('')
    try {
      const response = await api.post('/numbering/companies', { name: companyName, code: companyCode })
      setCompanies((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name, 'ar')))
      setCompanyId(String(response.data.id))
      setCompanyName('')
      setCompanyCode('')
      setNotice('تمت إضافة الشركة بنجاح.')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || ERROR_MESSAGES[requestError.response?.status] || 'تعذرت إضافة الشركة.')
    } finally {
      setSavingCompany(false)
    }
  }

  async function copyNumber(value) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('تعذر النسخ تلقائياً؛ حدّد الرقم وانسخه يدوياً.')
    }
  }

  function exportCsv() {
    const rows = [
      ['رقم المستند', 'الشركة', 'النوع', 'السنة', 'المستخدم', 'تاريخ التوليد'],
      ...filteredRecords.map((row) => [row.number, row.company_name, TYPE_LABELS[row.document_type], row.year, row.created_by_name, formatDate(row.created_at)]),
    ]
    const csv = '\ufeff' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = 'contract-invoice-numbers.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const contractsCount = records.filter((row) => row.document_type === 'CTR').length
  const invoicesCount = records.filter((row) => row.document_type === 'INV').length

  return (
    <div dir="rtl" className="min-h-full space-y-6 pb-10 text-slate-800">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white shadow-xl sm:px-9 sm:py-9">
        <div className="absolute -left-12 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100"><Sparkles size={14} /> نظام ترقيم المستندات</div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">أرقام العقود والفواتير، بضغطة واحدة</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">تسلسل مركزي مشترك بين المستخدمين، لكل شركة ونوع مستند وسنة، مع سجل محفوظ ومنع للتكرار عند التوليد المتزامن.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left" dir="ltr">
            <div className="text-[11px] text-slate-400">مثال على الرقم</div>
            <div className="mt-1 font-mono text-lg font-bold text-white">AN-CTR-{new Date().getFullYear()}-0001</div>
          </div>
        </div>
      </section>

      {(error || notice) && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || notice}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Building2} label="الشركات النشطة" value={companies.length} color="blue" />
        <StatCard icon={FileText} label="العقود المولّدة" value={contractsCount} color="violet" />
        <StatCard icon={ClipboardList} label="الفواتير المولّدة" value={invoicesCount} color="emerald" />
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Hash size={21} /></div>
            <div><h2 className="text-lg font-bold">توليد رقم جديد</h2><p className="mt-1 text-sm text-slate-500">اختر الشركة ونوع المستند ثم احجز الرقم.</p></div>
          </div>
          <div className="space-y-5">
            <label className="block text-sm font-semibold">الشركة
              <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} disabled={loading || !companies.length} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                {!companies.length && <option value="">لا توجد شركات</option>}
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name} ({company.code})</option>)}
              </select>
            </label>
            <div>
              <div className="mb-2 text-sm font-semibold">نوع المستند</div>
              <div className="grid grid-cols-2 gap-3">
                {[['CTR', 'عقد', FileText], ['INV', 'فاتورة', FilePlus2]].map(([type, label, Icon]) => (
                  <button type="button" key={type} onClick={() => setDocType(type)} className={`flex items-center gap-3 rounded-xl border p-4 text-right transition ${docType === type ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <Icon size={20} /><span><span className="block font-bold">{label}</span><span dir="ltr" className="mt-1 block font-mono text-xs">{type}</span></span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
              <span>الصيغة المتوقعة: <b dir="ltr" className="font-mono text-slate-800">{selectedCompany?.code || 'AN'}-{docType}-{new Date().getFullYear()}-0001</b></span>
            </div>
            <button type="button" onClick={generateNumber} disabled={generating || loading || !companies.length} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {generating ? <LoaderCircle className="animate-spin" size={19} /> : <Sparkles size={18} />}{generating ? 'جارٍ حجز الرقم…' : `توليد رقم ${TYPE_LABELS[docType]}`}
            </button>
          </div>
          {newest && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-sm font-semibold text-emerald-800">تم حجز الرقم بنجاح</div>
            <div dir="ltr" className="my-3 break-all font-mono text-2xl font-extrabold tracking-wide text-slate-900 sm:text-3xl">{newest.number}</div>
            <button type="button" onClick={() => copyNumber(newest.number)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'تم النسخ' : 'نسخ الرقم'}</button>
          </div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Building2 size={20} /></div>
            <div><h2 className="text-lg font-bold">إضافة شركة</h2><p className="mt-1 text-sm text-slate-500">حدّد رمزاً فريداً مختصراً من حرفين أو أكثر.</p></div>
          </div>
          <form onSubmit={addCompany} className="space-y-4">
            <label className="block text-sm font-semibold">اسم الشركة<input required minLength="2" maxLength="160" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="مثال: شركة الأنوار" className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            <label className="block text-sm font-semibold">رمز الشركة<input required minLength="2" maxLength="12" pattern="[A-Za-z0-9]+" value={companyCode} onChange={(event) => setCompanyCode(event.target.value.toUpperCase())} placeholder="مثال: AN" dir="ltr" className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-3 font-mono font-normal uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            <p className="text-xs leading-6 text-slate-500">يُستخدم الرمز في بداية رقم العقد أو الفاتورة، مثل <span dir="ltr" className="font-mono">{companyCode || 'AN'}-INV-{new Date().getFullYear()}-0001</span>.</p>
            <button type="submit" disabled={savingCompany} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">{savingCompany ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />}إضافة الشركة</button>
          </form>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-3 text-sm font-bold">الشركات المسجلة</div>
            <div className="max-h-52 space-y-2 overflow-auto">
              {companies.map((company) => <div key={company.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><span className="text-sm font-medium">{company.name}</span><span dir="ltr" className="rounded-md bg-white px-2 py-1 font-mono text-xs font-bold text-slate-600">{company.code}</span></div>)}
              {!companies.length && <div className="text-sm text-slate-500">{loading ? 'جارٍ التحميل…' : 'لا توجد شركات مسجلة.'}</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div><h2 className="font-bold">سجل الأرقام</h2><p className="mt-1 text-xs text-slate-500">يُحفظ كل رقم مع اسم المستخدم وتاريخ التوليد.</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="relative"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في السجل" className="w-48 rounded-lg border border-slate-300 py-2 pr-9 pl-3 text-sm outline-none focus:border-blue-500" /></label>
            <button type="button" onClick={loadData} title="تحديث" className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /></button>
            <button type="button" onClick={exportCsv} disabled={!filteredRecords.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Download size={16} />تصدير CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-semibold">رقم المستند</th><th className="px-5 py-3 font-semibold">الشركة</th><th className="px-5 py-3 font-semibold">النوع</th><th className="px-5 py-3 font-semibold">أنشأه</th><th className="px-5 py-3 font-semibold">تاريخ التوليد</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((row) => <tr key={row.id} className="hover:bg-slate-50/70"><td dir="ltr" className="px-5 py-3 text-right font-mono font-bold text-slate-800">{row.number}</td><td className="px-5 py-3">{row.company_name}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.document_type === 'CTR' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>{TYPE_LABELS[row.document_type]}</span></td><td className="px-5 py-3 text-slate-600">{row.created_by_name}</td><td className="px-5 py-3 text-slate-500">{formatDate(row.created_at)}</td></tr>)}
              {!filteredRecords.length && <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-500">{loading ? 'جارٍ تحميل السجل…' : 'لا توجد أرقام مطابقة للبحث.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">المعروض: {filteredRecords.length} من آخر {records.length} رقم محمّل.</div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', violet: 'bg-violet-50 text-violet-700', emerald: 'bg-emerald-50 text-emerald-700' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={`rounded-xl p-2.5 ${colors[color]}`}><Icon size={19} /></span></div><div className="mt-3 text-3xl font-extrabold text-slate-900">{value}</div></div>
}
