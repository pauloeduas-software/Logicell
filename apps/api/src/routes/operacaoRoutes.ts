// /home/penta/Logicell/apps/api/src/routes/operacaoRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { OperacaoController } from '../controllers/OperacaoController';

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

// Rotas Principais
router.post('/upload', upload.single('file'), OperacaoController.upload);
router.get('/operacoes', OperacaoController.list);
router.patch('/operacoes/:id', OperacaoController.update);

// Dashboard e Auxiliares
router.get('/dashboard', OperacaoController.getDashboard);
router.get('/agencies', OperacaoController.getAgencies);

// Seleção e Exportação
router.post('/worklist/toggle', OperacaoController.toggleWorkList);
router.post('/worklist/bulk', OperacaoController.bulkToggleWorkList);

// Verificação se o método export existe antes de registrar
if (OperacaoController.export) {
  router.get('/export', OperacaoController.export);
} else {
  // Fallback caso eu tenha esquecido de exportar o método no controller refatorado
  router.get('/export', OperacaoController.list); 
}

export default router;
