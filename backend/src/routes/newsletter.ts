import { Router } from 'express';
import type { Request, Response } from 'express';
import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ========== INTERFACES ==========
interface CreateNewsletterDTO {
  title: string;
  content: string;
  source: string;
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
const formatNewsletterResponse = (newsletter: Newsletter): NewsletterResponse => ({
  ...newsletter,
  formatted_date: new Date(newsletter.updated_at).toLocaleDateString('pt-BR'),
  short_content: newsletter.content.length > 100 
    ? newsletter.content.substring(0, 100) + '...' 
    : newsletter.content
});

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
    res.json(newsletters.map(formatNewsletterResponse));
    
  } catch (err) {
    console.error('❌ Erro ao listar newsletters:', err);
    res.status(500).json({ error: 'Erro ao buscar newsletters' });
  }
});

// GET /:id - Buscar por ID
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params; // ✅ Agora funciona!
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM newsletters WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter não encontrada' });
    }

    return res.json(formatNewsletterResponse(rows[0] as Newsletter));
    
  } catch (err) {
    console.error(`❌ Erro ao buscar newsletter ${id}:`, err);
    return res.status(500).json({ error: 'Erro ao buscar newsletter' });
  }
});

// POST / - Criar nova
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, source, link } = req.body as CreateNewsletterDTO;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO newsletters (title, content, source, link) VALUES (?, ?, ?, ?)',
      [title, content, source || '', link || '']
    );

    const [newRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM newsletters WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Newsletter criada com sucesso',
      newsletter: formatNewsletterResponse(newRows[0] as Newsletter)
    });
    
  } catch (err) {
    console.error('❌ Erro ao criar newsletter:', err);
    return res.status(500).json({ error: 'Erro ao criar newsletter' });
  }
});

// PUT /:id - Atualizar
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params; // ✅ Agora funciona!
  
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
    if (content) { updates.push('content = ?'); values.push(content); }
    if (source !== undefined) { updates.push('source = ?'); values.push(source); }
    if (link !== undefined) { updates.push('link = ?'); values.push(link); }

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

    return res.json({
      message: 'Newsletter atualizada com sucesso',
      newsletter: formatNewsletterResponse(updatedRows[0] as Newsletter)
    });
    
  } catch (err) {
    console.error(`❌ Erro ao atualizar newsletter ${id}:`, err);
    return res.status(500).json({ error: 'Erro ao atualizar newsletter' });
  }
});

// DELETE /:id - Remover
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  const { id } = req.params; // ✅ Agora funciona!
  
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

    const [_result] = await pool.query<ResultSetHeader>(
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