import { Router } from 'express';
import type { Request, Response } from 'express';
import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ========== INTERFACES ==========
interface CreateNewsletterDTO {
  title: string;
  content: string;
  source?: string;
  link: string;
}

interface Newsletter extends CreateNewsletterDTO {
  id: number;
  updated_at: string;
}

interface NewsletterResponse extends Newsletter {
  formatted_date?: string;
  short_content?: string;
}

// Interface para parâmetros de rota
interface IdParam {
  id: string;
}

// ========== UTILITÁRIOS ==========
const safeString = (value: string | null | undefined): string => {
  return value || ''; // Converte null/undefined para string vazia
};

const formatNewsletterResponse = (newsletter: Newsletter): NewsletterResponse => {
  // ✅ Garantir que todos os campos opcionais sejam strings seguras
  const safeNewsletter = {
    ...newsletter,
    content: safeString(newsletter.content),
    source: safeString(newsletter.source),
    link: safeString(newsletter.link)
  };
  
  return {
    ...safeNewsletter,
    formatted_date: new Date(safeNewsletter.updated_at).toLocaleDateString('pt-BR'),
    short_content: safeNewsletter.content.length > 100 
      ? safeNewsletter.content.substring(0, 100) + '...' 
      : safeNewsletter.content
  };
};

// ========== ROTAS ==========

// GET / - Listar todas
router.get('/', async (_: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, content, source, link, updated_at 
       FROM newsletters 
       ORDER BY updated_at DESC, id DESC`
    );
    
    const newsletters = rows as Newsletter[];
    
    // ✅ Garantir que todos os registros tenham content como string
    const safeNewsletters = newsletters.map(newsletter => ({
      ...newsletter,
      content: safeString(newsletter.content),
      source: safeString(newsletter.source),
      link: safeString(newsletter.link)
    }));
    
    res.json(safeNewsletters.map(formatNewsletterResponse));
    
  } catch (err) {
    console.error('❌ Erro ao listar newsletters:', err);
    res.status(500).json({ error: 'Erro ao buscar newsletters' });
  }
});

// GET /:id - Buscar por ID
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM newsletters WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter não encontrada' });
    }

    const newsletter = rows[0] as Newsletter;
    
    // ✅ Garantir campos seguros
    const safeNewsletter = {
      ...newsletter,
      content: safeString(newsletter.content),
      source: safeString(newsletter.source),
      link: safeString(newsletter.link)
    };
    
    return res.json(formatNewsletterResponse(safeNewsletter));
    
  } catch (err) {
    console.error(`❌ Erro ao buscar newsletter ${id}:`, err);
    return res.status(500).json({ error: 'Erro ao buscar newsletter' });
  }
});

// POST / - Criar nova
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, source, link } = req.body as CreateNewsletterDTO;

    // ✅ Apenas título obrigatório
    if (!title) {
      return res.status(400).json({ error: 'タイトルは必須です' });
    }

    // ✅ Garantir que campos opcionais nunca sejam null
    const contentValue = safeString(content);
    const sourceValue = safeString(source);
    const linkValue = safeString(link);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO newsletters (title, content, source, link) VALUES (?, ?, ?, ?)',
      [title, contentValue, sourceValue, linkValue]
    );

    const [newRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM newsletters WHERE id = ?',
      [result.insertId]
    );

    const newNewsletter = newRows[0] as Newsletter;
    
    // ✅ Garantir campos seguros
    const safeNewsletter = {
      ...newNewsletter,
      content: safeString(newNewsletter.content),
      source: safeString(newNewsletter.source),
      link: safeString(newNewsletter.link)
    };

    return res.status(201).json({
      message: 'Newsletter criada com sucesso',
      newsletter: formatNewsletterResponse(safeNewsletter)
    });
    
  } catch (err) {
    console.error('❌ Erro ao criar newsletter:', err);
    return res.status(500).json({ error: 'Erro ao criar newsletter' });
  }
});

// PUT /:id - Atualizar
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params;
  
  try {
    const { title, content, source, link } = req.body as Partial<CreateNewsletterDTO>;

    const [checkRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM newsletters WHERE id = ?',
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Newsletter não encontrada' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title) { updates.push('title = ?'); values.push(title); }
    // ✅ Content pode ser atualizado mesmo se vazio
    if (content !== undefined) { 
      updates.push('content = ?'); 
      values.push(safeString(content)); // Garantir que não seja null
    }
    if (source !== undefined) { 
      updates.push('source = ?'); 
      values.push(safeString(source)); 
    }
    if (link !== undefined) { 
      updates.push('link = ?'); 
      values.push(safeString(link)); 
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }

    values.push(id);
    
    await pool.query<ResultSetHeader>(
      `UPDATE newsletters SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM newsletters WHERE id = ?',
      [id]
    );

    const updatedNewsletter = updatedRows[0] as Newsletter;
    
    // ✅ Garantir campos seguros
    const safeNewsletter = {
      ...updatedNewsletter,
      content: safeString(updatedNewsletter.content),
      source: safeString(updatedNewsletter.source),
      link: safeString(updatedNewsletter.link)
    };

    return res.json({
      message: 'Newsletter atualizada com sucesso',
      newsletter: formatNewsletterResponse(safeNewsletter)
    });
    
  } catch (err) {
    console.error(`❌ Erro ao atualizar newsletter ${id}:`, err);
    return res.status(500).json({ error: 'Erro ao atualizar newsletter' });
  }
});

// DELETE /:id - Remover
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params;
  
  try {
    console.log(`📥 Removendo newsletter ID: ${id}`);

    const [checkRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM newsletters WHERE id = ?',
      [id]
    );

    if (checkRows.length === 0) {
      console.log(`⚠️ Newsletter ID ${id} não encontrada`);
      return res.status(404).json({ error: 'Newsletter não encontrada' });
    }

    await pool.query<ResultSetHeader>(
      'DELETE FROM newsletters WHERE id = ?', 
      [id]
    );

    console.log(`✅ Newsletter ID ${id} removida com sucesso`);

    return res.json({ 
      message: 'Newsletter removida com sucesso',
      id: parseInt(id)
    });
    
  } catch (err) {
    console.error(`❌ Erro ao remover newsletter ${id}:`, err);
    return res.status(500).json({ 
      error: 'Erro interno ao remover newsletter',
      id: parseInt(id)
    });
  }
});

export default router;