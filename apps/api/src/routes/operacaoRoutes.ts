// /home/penta/Logicell/apps/api/src/routes/operacaoRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { OperacaoController } from '../controllers/OperacaoController';
import { PastaController } from '../controllers/PastaController';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isExcel = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.mimetype === 'application/vnd.ms-excel' ||
                    file.originalname.endsWith('.xls') || 
                    file.originalname.endsWith('.xlsx');
    
    if (isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Use .xls ou .xlsx'));
    }
  }
});

// Operações
router.post('/upload', upload.single('file'), OperacaoController.upload);
router.get('/operacoes', OperacaoController.list);
router.patch('/operacoes/:id', OperacaoController.update);
router.get('/export', OperacaoController.export);

// Dashboard e Auxiliares
router.get('/dashboard', OperacaoController.getDashboard);
router.get('/agencies', OperacaoController.getAgencies);

// Gerenciamento de Pastas (Pastas)
router.get('/pastas', PastaController.listar);
router.post('/pastas', PastaController.criar);
router.patch('/pastas/:id', PastaController.atualizar);
router.delete('/pastas/:id', PastaController.excluir);

// Ações de Itens em Pastas
router.post('/pastas/itens', OperacaoController.addToPasta);
router.delete('/pastas/itens', OperacaoController.removeFromPasta);
router.post('/pastas/bulk', OperacaoController.bulkActionPasta);
router.delete('/operacoes/bulk', OperacaoController.bulkDelete);

export default router;
