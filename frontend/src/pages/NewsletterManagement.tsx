import { useEffect, useState } from "react";
import type { Newsletter } from "../types/types";
import { formatDateJP } from "../utils/formatDateJP";
// import './NewsletterManagement.css';

const API_URL = import.meta.env.VITE_API_URL;

type NewsletterSubmitData = Omit<Newsletter, 'id'>;

export default function NewsletterManagement() {
  const [list, setList] = useState<Newsletter[]>([]);
  const [, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Newsletter>({
    title: "",
    content: "",
    source: "site",
    link: "",
    updated_at: ""
  });
  
  const fetchNewsletters = async (): Promise<Newsletter[]> => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/newsletters`);
      
      if(!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("ネットワークエラー", err);
      setError(err instanceof Error ? err.message : 'エラー')
      return [];
    }
  };
  
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await fetchNewsletters();
      if (mounted) setList(data);
    };

    load();

    return () => {
      mounted = false;
    };
  },[]);

  const submit = async () => {
    if (!form.title.trim()){
      alert('タイトルは必須です');
      return;
    }

    setError(null);

    try {
      const method = form.id ? "PUT" : "POST";
      const url = form.id
      ? `${API_URL}/api/newsletters/${form.id}` : `${API_URL}/api/newsletters`;
      
       // ⚡ IMPORTANTE: Preparar dados - NÃO enviar content vazio
      const dataToSend: NewsletterSubmitData = {
        title: form.title.trim(),
        source: form.source,
        updated_at: new Date().toISOString()
      };

      // Só enviar content se tiver valor
      if (form.content?.trim()) {
        dataToSend.content = form.content.trim();
      }
      
      // Só enviar link se tiver valor
      if (form.link?.trim()) {
        dataToSend.link = form.link.trim();
      }
      
      // Adicionar updated_at
      dataToSend.updated_at = new Date().toISOString();

      console.log('📤 Enviando:', dataToSend); // DEBUG

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend), // Envia dados preparados
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      setForm({ title: "", content: "", source: "site", link: "", updated_at: "" });
      
      const data = await fetchNewsletters();
      setList(data);
      
    } catch (err) {
      console.error('Submit error: ', err); // ✅ Corrigido: err, não error
      setError(err instanceof Error ? err.message : 'Submit error');
      alert(`エラー: ${err instanceof Error ? err.message : '保存に失敗しました'}`);
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;
    
    await fetch(`${API_URL}/api/newsletters/${id}`,{
      method: "DELETE",
    });

    const data = await fetchNewsletters();
    setList(data);
  };

  const edit = (item: Newsletter) => setForm(item);

  const normalizedLink = (link: string) => {
    if (link.startsWith("http://") || link.startsWith("https://")) {
      return link;
    }
    return `http://${link}`;
  }
  
  return (
    <div className="newsletter-container"
    style={
        { 
          maxWidth: '800px',
          margin: '40px auto',
          padding: '24px'
        }}
    >
      <h2>ニュースレター管理</h2>

      <div className="newsletter-form">
        <input
          placeholder="タイトル"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <select
          value={form.source}
          onChange={(e) =>
            setForm({ ...form, source: e.target.value as "site" | "instagram" })
          }
        >
          <option value="site">サイト</option>
          <option value="instagram">インスタグラム</option>
        </select>

        <input
          placeholder="リンク（任意）"
          value={form.link || ""}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />

        <button onClick={submit}>
          {form.id ? "更新" : "登録"}
        </button>
      </div>

      <div className="newsletter-list">
        {list.map((item) => (
          <div className="newsletter-item" key={item.id}>
            
            <div className="newsletter-edit">
              <div className="newsletter-date">
                <span>{formatDateJP(item.updated_at)}</span>
              </div>
            
              <div className="newsletter-content">
                <span className="newsletter-source">
                  {item.source === "instagram" ? (
                    <img
                      src="https://framerusercontent.com/images/EPZRIYNlQSQIhx8T0YRVIpXZM.png"
                      alt="Instagram"
                      className="instagram-icon"
                    />
                  ) : (
                    <strong>HP</strong>
                  )}
                </span>
                {item.link ? (
                  <a
                    href={normalizedLink(item.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="newsletter-title"
                  >
                    {item.title}
                  </a> 
                ) : (
                  item.title
                )}
              </div>
            </div>

            <div className="newsletter-actions">
              <button className="edit" onClick={() => edit(item)}>
                編集
              </button>
              <button className="delete" onClick={() => remove(item.id)}>
                削除
              </button>
            </div>

            </div>
        ))}
      </div>
    </div>
  );
}