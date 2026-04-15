import {
  Controller,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env['UPLOAD_DIR'] ?? './data/uploads',
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
    }),
  )
  uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return { path: `/uploads/${file.filename}` };
  }

  @Get('/uploads/:filename')
  @Public()
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const uploadDir = process.env['UPLOAD_DIR'] ?? './data/uploads';
    const uploadDirResolved = path.resolve(uploadDir);
    const filePath = path.join(uploadDirResolved, filename);

    // Prevent path traversal attacks
    if (!filePath.startsWith(uploadDirResolved + path.sep) && filePath !== uploadDirResolved) {
      throw new NotFoundException();
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException();
    }

    res.sendFile(filePath);
  }
}
